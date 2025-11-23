using Microsoft.AspNetCore.Identity;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class UserLoginService
    {
        private readonly UserManager<AppUser> _userManager;

        public UserLoginService(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<List<UserLoginDTO>> GetUserLoginsAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var logins = await _userManager.GetLoginsAsync(user);
            return logins.Select(l => new UserLoginDTO
            {
                UserId = userId,
                LoginProvider = l.LoginProvider,
                ProviderKey = l.ProviderKey,
                ProviderDisplayName = l.ProviderDisplayName
            }).ToList();
        }

        public async Task RemoveUserLoginAsync(Guid userId, string loginProvider, string providerKey)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var result = await _userManager.RemoveLoginAsync(user, loginProvider, providerKey);
            
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }
    }
}

