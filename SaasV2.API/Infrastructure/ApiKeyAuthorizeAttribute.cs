using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;

namespace SaasV2.API.Infrastructure
{
    /// <summary>
    /// API Key veya Admin authentication'ı kabul eden attribute
    /// </summary>
    public class ApiKeyOrAdminAuthorizeAttribute : AuthorizeAttribute
    {
        public ApiKeyOrAdminAuthorizeAttribute()
        {
            // Hem API Key hem de Admin authentication'ı kabul et
            // Identity'nin kendi cookie authentication scheme'ini kullan
            AuthenticationSchemes = $"{ApiKeyAuthenticationHandler.AuthenticationScheme},{IdentityConstants.ApplicationScheme}";
            Policy = "ApiKeyOrAdmin";
        }
    }
}

