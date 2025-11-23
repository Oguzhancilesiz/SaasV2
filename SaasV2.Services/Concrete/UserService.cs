using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class UserService : IUserService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly RoleManager<AppRole> _roleManager;
        public UserService(UserManager<AppUser> userManager, SignInManager<AppUser> signInManager, RoleManager<AppRole> roleManager)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _roleManager = roleManager;
        }

        public async Task AddUserInRole(Guid userId, List<string> roles)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new Exception("Kullanıcı bulunamadı.");

            if (user.Status == Core.Enums.Status.Deleted)
                throw new Exception("Silinmiş kullanıcı.");

            roles ??= new List<string>();
            roles = roles.Select(r => r?.Trim())
                         .Where(r => !string.IsNullOrWhiteSpace(r))
                         .Distinct(StringComparer.OrdinalIgnoreCase)
                         .ToList();

            // Var olmayan rolleri yakala
            var allRoleNames = await _roleManager.Roles
                .Where(r => r.Status != Core.Enums.Status.Deleted)
                .Select(r => r.Name)
                .ToListAsync();

            var invalid = roles.Except(allRoleNames, StringComparer.OrdinalIgnoreCase).ToList();
            if (invalid.Any())
                throw new Exception($"Geçersiz roller: {string.Join(", ", invalid)}");

            var current = await _userManager.GetRolesAsync(user);
            var remove = current.Except(roles, StringComparer.OrdinalIgnoreCase).ToArray();
            var add = roles.Except(current, StringComparer.OrdinalIgnoreCase).ToArray();

            if (remove.Length > 0)
            {
                var rm = await _userManager.RemoveFromRolesAsync(user, remove);
                if (!rm.Succeeded) throw new Exception(string.Join(" | ", rm.Errors.Select(e => e.Description)));
            }

            if (add.Length > 0)
            {
                var ad = await _userManager.AddToRolesAsync(user, add);
                if (!ad.Succeeded) throw new Exception(string.Join(" | ", ad.Errors.Select(e => e.Description)));
            }
        }


        public async Task UnApprovedUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new Exception("Kullanıcı bulunamadı.");

            user.Status = Core.Enums.Status.UnApproved;
            user.ModifiedDate = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task<List<UserDTO>> GetAllUser()
        {
            return await _userManager.Users
                .Where(x => x.Status != Core.Enums.Status.Deleted)
                .OrderByDescending(x => x.CreatedDate)
                .Select(x => new UserDTO
                {
                    UserId = x.Id,
                    UserName = x.UserName,
                    Email = x.Email,
                    Phone = x.PhoneNumber,
                    Status = x.Status
                })
                .ToListAsync();
        }


        public async Task<UserDTO> GetById(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.Status == Core.Enums.Status.Deleted)
                throw new Exception("Kullanıcı bulunamadı.");

            return new UserDTO
            {
                UserId = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Phone = user.PhoneNumber,
                Status = user.Status
            };
        }

        public async Task<UserDTO> GetByUser(string userName)
        {
            var user = await _userManager.FindByNameAsync(userName);
            if (user == null || user.Status == Core.Enums.Status.Deleted)
            {
                throw new Exception("Kullanıcı bulunamadı");
            }
            return new UserDTO
            {
                UserId = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                Phone = user.PhoneNumber,
                Status = user.Status
            };
        }

        public async Task<List<string>> GetRolesByUserId(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString());
            if (user == null || user.Status == Core.Enums.Status.Deleted)
            {
                throw new Exception("Kullanıcı bulunamadı");
            }

            var roles = await _userManager.GetRolesAsync(user);
            if (roles == null || !roles.Any())
            {
                roles = new List<string> { "No roles assigned" };
            }
            return roles.ToList();
        }

        public async Task Login(LoginDTO login)
        {
            if (string.IsNullOrWhiteSpace(login.UserName) || string.IsNullOrWhiteSpace(login.Password))
                throw new ArgumentException("Kullanıcı adı ve şifre zorunlu.");

            var user = await _userManager.FindByNameAsync(login.UserName.Trim());
            if (user == null || user.Status == Core.Enums.Status.Deleted)
                throw new Exception("Kullanıcı bulunamadı.");

            if (user.Status != Core.Enums.Status.Approved)
                throw new Exception("Hesap onaylı değil.");

            // Admin rol kontrolü
            var roles = await _userManager.GetRolesAsync(user);
            if (!roles.Contains("Admin"))
                throw new UnauthorizedAccessException("Sadece Admin rolüne sahip kullanıcılar giriş yapabilir.");

            var signIn = await _signInManager.PasswordSignInAsync(user, login.Password, isPersistent: login.RememberMe, lockoutOnFailure: true);
            
            if (signIn.IsLockedOut)
                throw new Exception("Hesap geçici olarak kilitlendi. Lütfen daha sonra tekrar deneyin.");
            
            if (!signIn.Succeeded)
                throw new Exception("Kullanıcı adı veya şifre hatalı.");
        }


        public async Task Register(RegisterDTO register)
        {
            if (string.IsNullOrWhiteSpace(register.UserName) ||
                string.IsNullOrWhiteSpace(register.Password) ||
                string.IsNullOrWhiteSpace(register.Email))
                throw new ArgumentException("Kullanıcı adı, şifre ve e-posta zorunlu.");

            var now = DateTime.UtcNow;

            var userName = register.UserName.Trim();
            var email = register.Email.Trim();
            var phone = register.Phone?.Trim();

            // Duplicate kontrol
            var existingByName = await _userManager.FindByNameAsync(userName);
            if (existingByName != null && existingByName.Status != Core.Enums.Status.Deleted)
                throw new InvalidOperationException("Bu kullanıcı adı kullanımda.");

            var existingByEmail = await _userManager.FindByEmailAsync(email);
            if (existingByEmail != null && existingByEmail.Status != Core.Enums.Status.Deleted)
                throw new InvalidOperationException("Bu e-posta kullanımda.");

            var appUser = new AppUser
            {
                UserName = userName,
                Email = email,
                PhoneNumber = phone,
                Status = Core.Enums.Status.UnApproved,
                CreatedDate = now,
                ModifiedDate = now
            };

            var result = await _userManager.CreateAsync(appUser, register.Password);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));

            // Varsayılan rol
            await _userManager.AddToRoleAsync(appUser, "User");
        }


        public async Task SignOut()
        {
            await _signInManager.SignOutAsync();
        }

        public async Task DeleteUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new Exception("Kullanıcı bulunamadı.");

            user.Status = Core.Enums.Status.Deleted;
            user.ModifiedDate = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task ActiveUser(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new Exception("Kullanıcı bulunamadı.");

            user.Status = Core.Enums.Status.Approved;
            user.ModifiedDate = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task<UserDTO> GetByName(string userName)
        {
            var name = userName?.Trim();
            var user = await _userManager.Users
                .Where(x => x.UserName == name && x.Status != Core.Enums.Status.Deleted)
                .Select(x => new UserDTO
                {
                    UserId = x.Id,
                    UserName = x.UserName,
                    Email = x.Email,
                    Phone = x.PhoneNumber,
                    Status = x.Status
                })
                .FirstOrDefaultAsync();

            return user; // null dönebilir; üst katmanda 404 mantığını sen yönetirsin
        }
    }
}
