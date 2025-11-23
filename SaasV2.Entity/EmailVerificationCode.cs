using SaasV2.Core.Abstracts;

namespace SaasV2.Entity
{
    /// <summary>
    /// E-posta doğrulama kodları
    /// </summary>
    public class EmailVerificationCode : BaseEntity
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public bool IsUsed { get; set; }
        public DateTime? UsedAt { get; set; }
        public string? UserName { get; set; } // Kayıt için kullanıcı adı
        public string? PasswordHash { get; set; } // Kayıt için şifre hash'i (geçici)
    }
}

