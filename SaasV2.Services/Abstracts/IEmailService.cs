namespace SaasV2.Services.Abstracts
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string toName, string subject, string body, bool isHtml = true);
        Task<bool> SendVerificationCodeAsync(string email, string code);
    }
}

