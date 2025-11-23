using Microsoft.AspNetCore.Authorization;

namespace SaasV2.API.Infrastructure;

public sealed class AdminAuthorizeAttribute : AuthorizeAttribute
{
    public const string RequiredRole = "Admin";

    public AdminAuthorizeAttribute()
    {
        Roles = RequiredRole;
    }
}

