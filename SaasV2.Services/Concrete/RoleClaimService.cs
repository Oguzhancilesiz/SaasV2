using Microsoft.AspNetCore.Identity;
using SaasV2.DTOs.RoleDTOs;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class RoleClaimService
    {
        private readonly RoleManager<AppRole> _roleManager;

        public RoleClaimService(RoleManager<AppRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task<List<RoleClaimDTO>> GetRoleClaimsAsync(Guid roleId)
        {
            var role = await _roleManager.FindByIdAsync(roleId.ToString())
                ?? throw new KeyNotFoundException("Rol bulunamadı.");

            var claims = await _roleManager.GetClaimsAsync(role);
            return claims.Select(c => new RoleClaimDTO
            {
                RoleId = roleId,
                ClaimType = c.Type,
                ClaimValue = c.Value
            }).ToList();
        }

        public async Task AddRoleClaimAsync(RoleClaimAddDTO dto)
        {
            var role = await _roleManager.FindByIdAsync(dto.RoleId.ToString())
                ?? throw new KeyNotFoundException("Rol bulunamadı.");

            var claim = new System.Security.Claims.Claim(dto.ClaimType, dto.ClaimValue);
            var result = await _roleManager.AddClaimAsync(role, claim);
            
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task RemoveRoleClaimAsync(Guid roleId, string claimType, string claimValue)
        {
            var role = await _roleManager.FindByIdAsync(roleId.ToString())
                ?? throw new KeyNotFoundException("Rol bulunamadı.");

            var claim = new System.Security.Claims.Claim(claimType, claimValue);
            var result = await _roleManager.RemoveClaimAsync(role, claim);
            
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }
    }
}

