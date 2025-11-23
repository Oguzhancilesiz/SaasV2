using SaasV2.Entity;

namespace SaasV2.Services.Abstracts
{
    public interface IEmailVerificationService
    {
        Task<string> GenerateAndSendCodeAsync(string email, string? userName = null, string? passwordHash = null);
        Task<bool> VerifyCodeAsync(string email, string code);
        Task<bool> VerifyAndCompleteRegistrationAsync(string email, string code, string userName, string password);
        Task<EmailVerificationCode?> GetVerificationCodeAsync(string email, string code);
    }
}

