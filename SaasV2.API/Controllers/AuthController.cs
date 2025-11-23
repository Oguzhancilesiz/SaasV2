using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Core.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly SignInManager<AppUser> _signInManager;
    private readonly UserManager<AppUser> _userManager;
    private readonly IUserService _userService;
    private readonly IEmailVerificationService _emailVerificationService;
    private readonly IUnitOfWork _uow;

    public AuthController(
        SignInManager<AppUser> signInManager, 
        UserManager<AppUser> userManager,
        IUserService userService,
        IEmailVerificationService emailVerificationService,
        IUnitOfWork uow)
    {
        _signInManager = signInManager;
        _userManager = userManager;
        _userService = userService;
        _emailVerificationService = emailVerificationService;
        _uow = uow;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var user = await FindUserAsync(request.UserName);
        if (user is null)
        {
            return Unauthorized(new { message = "Kullanıcı adı bulunamadı." });
        }

        // Mobile app için: Email ve telefon doğrulaması opsiyonel, sadece Approved durumu kontrol edilir
        if (user.Status != SaasV2.Core.Enums.Status.Approved)
        {
            return Unauthorized(new { message = $"Kullanıcı durumu uygun değil: {user.Status}." });
        }

        var result = await _signInManager.PasswordSignInAsync(user, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            return Ok(await BuildAuthUserAsync(user));
        }

        if (result.IsLockedOut)
        {
            return StatusCode(StatusCodes.Status423Locked, new { message = "Hesap çok sayıda hatalı deneme nedeniyle kilitlendi." });
        }

        if (result.RequiresTwoFactor)
        {
            return StatusCode(StatusCodes.Status412PreconditionFailed, new { message = "İki faktör doğrulama gerekli." });
        }

        return Unauthorized(new { message = "Şifre hatalı." });
    }

    [HttpPost("admin/login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> AdminLogin([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        var user = await FindUserAsync(request.UserName);
        if (user is null)
        {
            return Unauthorized(new { message = "Kullanıcı adı bulunamadı." });
        }

        // Admin panel için: Email ve telefon doğrulaması zorunlu
        if (!user.EmailConfirmed)
        {
            return Unauthorized(new { message = "E-posta adresi doğrulanmamış." });
        }

        if (!user.PhoneNumberConfirmed)
        {
            return Unauthorized(new { message = "Telefon numarası doğrulanmamış." });
        }

        if (user.Status != SaasV2.Core.Enums.Status.Approved)
        {
            return Unauthorized(new { message = $"Kullanıcı durumu uygun değil: {user.Status}." });
        }

        // Admin panel için: Admin rolü zorunlu
        if (!await _userManager.IsInRoleAsync(user, AdminAuthorizeAttribute.RequiredRole))
        {
            return Unauthorized(new { message = "Yönetici yetkisi bulunmuyor." });
        }

        var result = await _signInManager.PasswordSignInAsync(user, request.Password, request.RememberMe, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            return Ok(await BuildAuthUserAsync(user));
        }

        if (result.IsLockedOut)
        {
            return StatusCode(StatusCodes.Status423Locked, new { message = "Hesap çok sayıda hatalı deneme nedeniyle kilitlendi." });
        }

        if (result.RequiresTwoFactor)
        {
            return StatusCode(StatusCodes.Status412PreconditionFailed, new { message = "İki faktör doğrulama gerekli." });
        }

        return Unauthorized(new { message = "Şifre hatalı." });
    }

    [HttpPost("register/send-code")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendVerificationCode([FromBody] SendCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            // Kullanıcı adı ve email kontrolü
            var existingByName = await _userManager.FindByNameAsync(request.UserName);
            if (existingByName != null && existingByName.Status != Core.Enums.Status.Deleted)
            {
                return BadRequest(new { message = "Bu kullanıcı adı kullanımda." });
            }

            var existingByEmail = await _userManager.FindByEmailAsync(request.Email);
            if (existingByEmail != null && existingByEmail.Status != Core.Enums.Status.Deleted)
            {
                return BadRequest(new { message = "Bu e-posta kullanımda." });
            }

            // Şifre hash'ini geçici olarak sakla (verification code ile birlikte)
            var passwordHasher = new PasswordHasher<AppUser>();
            var tempUser = new AppUser { UserName = request.UserName };
            var passwordHash = passwordHasher.HashPassword(tempUser, request.Password);

            // Doğrulama kodu gönder
            await _emailVerificationService.GenerateAndSendCodeAsync(request.Email, request.UserName, passwordHash);

            return Ok(new { message = "Doğrulama kodu e-posta adresinize gönderildi." });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("register/verify")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyAndRegister([FromBody] VerifyCodeRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            // Kodu doğrula
            var isValid = await _emailVerificationService.VerifyCodeAsync(request.Email, request.Code);
            if (!isValid)
            {
                return BadRequest(new { message = "Geçersiz veya süresi dolmuş doğrulama kodu." });
            }

            // Doğrulama kodundan kullanıcı bilgilerini al
            var verificationCode = await _emailVerificationService.GetVerificationCodeAsync(request.Email, request.Code);
            if (verificationCode == null || verificationCode.IsUsed)
            {
                return BadRequest(new { message = "Doğrulama kodu bulunamadı veya kullanılmış." });
            }

            // Kullanıcı adı kontrolü
            if (verificationCode.UserName != request.UserName)
            {
                return BadRequest(new { message = "Kullanıcı adı doğrulama kodu ile eşleşmiyor." });
            }

            // Kullanıcıyı oluştur
            var registerDto = new RegisterDTO
            {
                UserName = request.UserName,
                Password = request.Password, // Şifreyi tekrar hash'leyecek
                Email = request.Email,
                Phone = null // Telefon zorunlu değil
            };

            await _userService.Register(registerDto);

            // Email'i doğrulanmış olarak işaretle
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user != null)
            {
                user.EmailConfirmed = true;
                await _userManager.UpdateAsync(user);
            }

            return Ok(new { 
                message = "Kayıt başarılı. Hesabınız admin onayı bekliyor.",
                userId = user?.Id,
                userName = user?.UserName,
                email = user?.Email
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [Obsolete("Use /register/send-code and /register/verify instead")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (!ModelState.IsValid)
        {
            return ValidationProblem(ModelState);
        }

        try
        {
            var registerDto = new RegisterDTO
            {
                UserName = request.UserName,
                Password = request.Password,
                Email = request.Email,
                Phone = request.Phone
            };

            await _userService.Register(registerDto);

            // Kullanıcıyı bul ve response döndür
            var user = await _userManager.FindByNameAsync(request.UserName);
            if (user != null)
            {
                return Ok(new { 
                    message = "Kayıt başarılı. Hesabınız admin onayı bekliyor.",
                    userId = user.Id,
                    userName = user.UserName,
                    email = user.Email
                });
            }

            return Ok(new { message = "Kayıt başarılı. Hesabınız admin onayı bekliyor." });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new { message = ex.Message });
        }
    }


    [HttpPost("logout")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }

    [HttpGet("health")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Health()
    {
        return Ok(new { status = "ok", message = "API is running", timestamp = DateTime.UtcNow });
    }

    [HttpGet("debug")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Debug()
    {
        var cookies = Request.Cookies.Select(c => new { Name = c.Key, Value = c.Value?.Substring(0, Math.Min(50, c.Value?.Length ?? 0)) + "..." }).ToList();
        var cookieHeader = Request.Headers["Cookie"].ToString();
        var isAuthenticated = User.Identity?.IsAuthenticated ?? false;
        var authType = User.Identity?.AuthenticationType;
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        
        return Ok(new 
        { 
            cookies,
            cookieHeader = cookieHeader?.Substring(0, Math.Min(200, cookieHeader?.Length ?? 0)),
            isAuthenticated,
            authType,
            claims,
            user = User.Identity?.Name
        });
    }

    [HttpGet("me")]
    [AdminAuthorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await BuildAuthUserAsync(user));
    }

    private async Task<AppUser?> FindUserAsync(string userNameOrEmail)
    {
        var user = await _userManager.FindByNameAsync(userNameOrEmail);
        if (user is not null)
        {
            return user;
        }

        if (userNameOrEmail.Contains('@'))
        {
            user = await _userManager.FindByEmailAsync(userNameOrEmail);
        }

        return user;
    }

    private async Task<AuthUserResponse> BuildAuthUserAsync(AppUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new AuthUserResponse(user.Id, user.UserName ?? string.Empty, user.Email, roles.ToArray());
    }

    public record LoginRequest(
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")] string UserName,
        [Required(ErrorMessage = "Şifre zorunludur.")] string Password,
        bool RememberMe);

    public record RegisterRequest(
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")] string UserName,
        [Required(ErrorMessage = "Şifre zorunludur.")] string Password,
        [Required(ErrorMessage = "E-posta zorunludur.")] 
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")] string Email,
        string? Phone);

    public record SendCodeRequest(
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")] string UserName,
        [Required(ErrorMessage = "E-posta zorunludur.")] 
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")] string Email,
        [Required(ErrorMessage = "Şifre zorunludur.")] string Password);

    public record VerifyCodeRequest(
        [Required(ErrorMessage = "E-posta zorunludur.")] 
        [EmailAddress(ErrorMessage = "Geçerli bir e-posta adresi giriniz.")] string Email,
        [Required(ErrorMessage = "Doğrulama kodu zorunludur.")] string Code,
        [Required(ErrorMessage = "Kullanıcı adı zorunludur.")] string UserName,
        [Required(ErrorMessage = "Şifre zorunludur.")] string Password);

    public record AuthUserResponse(Guid UserId, string UserName, string? Email, string[] Roles);
}

