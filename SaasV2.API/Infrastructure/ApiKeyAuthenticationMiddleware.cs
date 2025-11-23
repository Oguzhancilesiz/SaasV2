using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using SaasV2.Services.Abstracts;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.API.Infrastructure
{
    public class ApiKeyAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private const string API_KEY_HEADER = "X-API-Key";
        private const string API_KEY_APP_ID_HEADER = "X-App-Id";

        public ApiKeyAuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Sadece /api/ endpoint'lerinde API key kontrolü yap (admin panel endpoint'leri hariç)
            var path = context.Request.Path.Value?.ToLower() ?? string.Empty;
            
            // Identity cookie ile korunan admin API'leri ve auth endpoint'leri için bu middleware'i atla
            if (path.StartsWith("/auth") ||
                path.StartsWith("/api/"))
            {
                await _next(context);
                return;
            }

            // API key header'ı var mı kontrol et
            if (context.Request.Headers.ContainsKey(API_KEY_HEADER) && 
                context.Request.Headers.ContainsKey(API_KEY_APP_ID_HEADER))
            {
                var apiKey = context.Request.Headers[API_KEY_HEADER].ToString();
                var appIdStr = context.Request.Headers[API_KEY_APP_ID_HEADER].ToString();

                if (Guid.TryParse(appIdStr, out var appId))
                {
                    var apiKeyService = context.RequestServices.GetRequiredService<IApiKeyService>();
                    
                    try
                    {
                        // API key formatı: prefix_hash (prefix içinde alt çizgi olabilir, son alt çizgiden sonrası hash)
                        var lastUnderscoreIndex = apiKey.LastIndexOf('_');
                        if (lastUnderscoreIndex >= 0 && lastUnderscoreIndex < apiKey.Length - 1)
                        {
                            var prefix = apiKey.Substring(0, lastUnderscoreIndex);
                            var hash = apiKey.Substring(lastUnderscoreIndex + 1);

                            // API key doğrulama
                            var isValid = await apiKeyService.ValidateAsync(appId, prefix, hash);
                            if (isValid)
                            {
                                // Geçerli API key - request'i devam ettir
                                await _next(context);
                                return;
                            }
                        }
                    }
                    catch
                    {
                        // API key doğrulama hatası
                    }
                }

                // Geçersiz API key
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Geçersiz API key.");
                return;
            }

            // API key yoksa normal authentication kontrolü yapılacak
            await _next(context);
        }
    }
}

