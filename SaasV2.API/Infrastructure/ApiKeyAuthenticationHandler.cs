using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;
using SaasV2.Services.Abstracts;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace SaasV2.API.Infrastructure
{
    public class ApiKeyAuthenticationHandler : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        private const string API_KEY_HEADER = "X-API-Key";
        private const string API_KEY_APP_ID_HEADER = "X-App-Id";
        public const string AuthenticationScheme = "ApiKey";

        public ApiKeyAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // API key header'ları kontrol et
            if (!Request.Headers.ContainsKey(API_KEY_HEADER) ||
                !Request.Headers.ContainsKey(API_KEY_APP_ID_HEADER))
            {
                return AuthenticateResult.NoResult();
            }

            var apiKey = Request.Headers[API_KEY_HEADER].ToString();
            var appIdStr = Request.Headers[API_KEY_APP_ID_HEADER].ToString();

            if (!Guid.TryParse(appIdStr, out var appId))
            {
                return AuthenticateResult.Fail("Geçersiz App ID formatı.");
            }

            var apiKeyService = Request.HttpContext.RequestServices.GetRequiredService<IApiKeyService>();

            try
            {
                // API key formatı: prefix_hash (prefix içinde alt çizgi olabilir, son alt çizgiden sonrası hash)
                var lastUnderscoreIndex = apiKey.LastIndexOf('_');
                if (lastUnderscoreIndex < 0 || lastUnderscoreIndex == apiKey.Length - 1)
                {
                    Logger.LogWarning("API key format hatası. Key: {ApiKeyPrefix}...", apiKey.Length > 20 ? apiKey.Substring(0, 20) : apiKey);
                    return AuthenticateResult.Fail("Geçersiz API key formatı.");
                }

                var prefix = apiKey.Substring(0, lastUnderscoreIndex);
                var hash = apiKey.Substring(lastUnderscoreIndex + 1);

                Logger.LogDebug("API key parse: Prefix={Prefix}, HashLength={HashLength}, AppId={AppId}", 
                    prefix, hash.Length, appId);

                // API key doğrulama
                var isValid = await apiKeyService.ValidateAsync(appId, prefix, hash);
                if (!isValid)
                {
                    Logger.LogWarning("API key doğrulama başarısız. Prefix={Prefix}, AppId={AppId}", prefix, appId);
                    return AuthenticateResult.Fail("Geçersiz API key.");
                }

                // API key bilgilerini al
                var apiKeyEntity = await apiKeyService.GetByPrefixAsync(appId, prefix);
                if (apiKeyEntity == null)
                {
                    return AuthenticateResult.Fail("API key bulunamadı.");
                }

                // Last used güncelle
                await apiKeyService.TouchLastUsedAsync(apiKeyEntity.Id);

                // Claims oluştur
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, appId.ToString()),
                    new Claim("AppId", appId.ToString()),
                    new Claim("ApiKeyId", apiKeyEntity.Id.ToString()),
                    new Claim(ClaimTypes.AuthenticationMethod, AuthenticationScheme)
                };

                var identity = new ClaimsIdentity(claims, AuthenticationScheme);
                var principal = new ClaimsPrincipal(identity);
                var ticket = new AuthenticationTicket(principal, AuthenticationScheme);

                return AuthenticateResult.Success(ticket);
            }
            catch (Exception ex)
            {
                Logger.LogError(ex, "API key doğrulama hatası.");
                return AuthenticateResult.Fail("API key doğrulama hatası.");
            }
        }
    }
}

