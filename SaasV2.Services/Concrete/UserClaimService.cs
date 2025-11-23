using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class UserClaimService
    {
        private readonly UserManager<AppUser> _userManager;

        public UserClaimService(UserManager<AppUser> userManager)
        {
            _userManager = userManager;
        }

        public async Task<List<UserClaimDTO>> GetUserClaimsAsync(Guid userId)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var claims = await _userManager.GetClaimsAsync(user);
            return claims.Select(c => new UserClaimDTO
            {
                UserId = userId,
                ClaimType = c.Type,
                ClaimValue = c.Value
            }).ToList();
        }

        public async Task AddUserClaimAsync(UserClaimAddDTO dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId.ToString())
                ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var claim = new System.Security.Claims.Claim(dto.ClaimType, dto.ClaimValue);
            var result = await _userManager.AddClaimAsync(user, claim);
            
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task RemoveUserClaimAsync(Guid userId, string claimType, string claimValue)
        {
            var user = await _userManager.FindByIdAsync(userId.ToString())
                ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

            var claim = new System.Security.Claims.Claim(claimType, claimValue);
            var result = await _userManager.RemoveClaimAsync(user, claim);
            
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }
    }
}

