using System.Net;
using System.Net.Mail;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SaasV2.Core.Configuration;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class EmailService : IEmailService
    {
        private readonly SmtpOptions _options;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<SmtpOptions> options, ILogger<EmailService> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string toName, string subject, string body, bool isHtml = true)
        {
            try
            {
                using var client = new SmtpClient(_options.Host, _options.Port)
                {
                    EnableSsl = _options.UseSsl,
                    Credentials = new NetworkCredential(_options.UserName, _options.Password),
                    Timeout = _options.TimeoutMs
                };

                using var message = new MailMessage
                {
                    From = new MailAddress(_options.FromEmail, _options.FromName),
                    Subject = subject,
                    Body = body,
                    IsBodyHtml = isHtml,
                    BodyEncoding = Encoding.UTF8,
                    SubjectEncoding = Encoding.UTF8
                };

                message.To.Add(new MailAddress(toEmail, toName));

                await client.SendMailAsync(message);
                _logger.LogInformation($"Email gönderildi: {toEmail}, Konu: {subject}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Email gönderme hatası: {toEmail}, Konu: {subject}");
                throw;
            }
        }

        public async Task<bool> SendVerificationCodeAsync(string email, string code)
        {
            try
            {
                var subject = "E-posta Doğrulama Kodu - OnlyIK";
                var body = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .code {{ background: #ffffff; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; margin: 20px 0; }}
        .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>OnlyIK</h1>
            <p>E-posta Doğrulama</p>
        </div>
        <div class='content'>
            <p>Merhaba,</p>
            <p>Hesabınızı doğrulamak için aşağıdaki doğrulama kodunu kullanın:</p>
            <div class='code'>{code}</div>
            <p>Bu kod 10 dakika süreyle geçerlidir.</p>
            <p>Eğer bu işlemi siz yapmadıysanız, lütfen bu e-postayı görmezden gelin.</p>
        </div>
        <div class='footer'>
            <p>© {DateTime.Now.Year} OnlyIK. Tüm hakları saklıdır.</p>
        </div>
    </div>
</body>
</html>";

                await SendEmailAsync(email, email, subject, body, isHtml: true);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Doğrulama kodu gönderme hatası: {email}");
                return false;
            }
        }
    }
}

