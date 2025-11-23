using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class EmailVerificationService : IEmailVerificationService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<EmailVerificationCode> _codeRepo;
        private readonly IEmailService _emailService;
        private readonly ILogger<EmailVerificationService> _logger;

        public EmailVerificationService(
            IUnitOfWork uow,
            IEmailService emailService,
            ILogger<EmailVerificationService> logger)
        {
            _uow = uow;
            _codeRepo = _uow.Repository<EmailVerificationCode>();
            _emailService = emailService;
            _logger = logger;
        }

        public async Task<string> GenerateAndSendCodeAsync(string email, string? userName = null, string? passwordHash = null)
        {
            // Eski kullanılmamış kodları işaretle (temizlik)
            var oldCodes = await _codeRepo.GetBy(x => 
                x.Email == email && 
                !x.IsUsed && 
                x.ExpiresAt > DateTime.UtcNow);
            
            var oldCodesList = await oldCodes.ToListAsync();
            foreach (var oldCode in oldCodesList)
            {
                oldCode.Status = Status.Deleted;
                await _codeRepo.Update(oldCode);
            }

            // Yeni kod oluştur
            var code = GenerateRandomCode();
            var expiresAt = DateTime.UtcNow.AddMinutes(10); // 10 dakika geçerli

            var verificationCode = new EmailVerificationCode
            {
                Id = Guid.NewGuid(),
                Email = email,
                Code = code,
                ExpiresAt = expiresAt,
                IsUsed = false,
                UserName = userName,
                PasswordHash = passwordHash,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };

            await _codeRepo.AddAsync(verificationCode);
            await _uow.SaveChangesAsync();

            // Email gönder
            var emailSent = await _emailService.SendVerificationCodeAsync(email, code);
            if (!emailSent)
            {
                _logger.LogWarning($"Doğrulama kodu email gönderilemedi: {email}");
                // Kod kaydedildi ama email gönderilemedi, yine de devam et
            }

            return code;
        }

        public async Task<bool> VerifyCodeAsync(string email, string code)
        {
            var q = await _codeRepo.GetBy(x => 
                x.Email == email && 
                x.Code == code && 
                !x.IsUsed && 
                x.ExpiresAt > DateTime.UtcNow &&
                x.Status != Status.Deleted);

            var verificationCode = await q.FirstOrDefaultAsync();
            
            if (verificationCode == null)
            {
                _logger.LogWarning($"Geçersiz doğrulama kodu: {email}, Code: {code}");
                return false;
            }

            // Kodu kullanıldı olarak işaretle
            verificationCode.IsUsed = true;
            verificationCode.UsedAt = DateTime.UtcNow;
            verificationCode.ModifiedDate = DateTime.UtcNow;
            await _codeRepo.Update(verificationCode);
            await _uow.SaveChangesAsync();

            return true;
        }

        public async Task<bool> VerifyAndCompleteRegistrationAsync(string email, string code, string userName, string password)
        {
            var q = await _codeRepo.GetBy(x => 
                x.Email == email && 
                x.Code == code && 
                !x.IsUsed && 
                x.ExpiresAt > DateTime.UtcNow &&
                x.Status != Status.Deleted);

            var verificationCode = await q.FirstOrDefaultAsync();
            
            if (verificationCode == null)
            {
                _logger.LogWarning($"Geçersiz doğrulama kodu (kayıt): {email}, Code: {code}");
                return false;
            }

            // Kodu kullanıldı olarak işaretle
            verificationCode.IsUsed = true;
            verificationCode.UsedAt = DateTime.UtcNow;
            verificationCode.ModifiedDate = DateTime.UtcNow;
            await _codeRepo.Update(verificationCode);
            await _uow.SaveChangesAsync();

            return true;
        }

        public async Task<EmailVerificationCode?> GetVerificationCodeAsync(string email, string code)
        {
            var q = await _codeRepo.GetBy(x => 
                x.Email == email && 
                x.Code == code &&
                x.Status != Status.Deleted);

            return await q.FirstOrDefaultAsync();
        }

        private string GenerateRandomCode()
        {
            var random = new Random();
            return random.Next(100000, 999999).ToString(); // 6 haneli kod
        }
    }
}

