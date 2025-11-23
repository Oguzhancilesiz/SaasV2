using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SaasV2.DTOs.RoleDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using SaasV2.Core.Enums;

namespace SaasV2.Services.Concrete
{
    public class RoleService : IRoleService
    {
        private readonly RoleManager<AppRole> _roleManager;

        public RoleService(RoleManager<AppRole> roleManager)
        {
            _roleManager = roleManager;
        }

        public async Task AddRole(RoleAddDTO role)
        {
            if (role == null || string.IsNullOrWhiteSpace(role.Name))
                throw new ArgumentException("Role name zorunlu.");

            var existing = await _roleManager.FindByNameAsync(role.Name.Trim());
            if (existing != null && existing.Status != Status.Deleted)
                throw new InvalidOperationException("Bu isimde aktif bir rol zaten var.");

            var now = DateTime.UtcNow;

            var appRole = new AppRole
            {
                Name = role.Name.Trim(),
                CreatedDate = now,
                ModifiedDate = now,
                Status = Status.Active
            };

            var result = await _roleManager.CreateAsync(appRole);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task DeleteRole(Guid id)
        {
            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null)
                throw new KeyNotFoundException("Rol bulunamadı.");

            // Soft delete: Status = Deleted
            role.Status = Status.Deleted;
            role.ModifiedDate = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task<RoleDTO?> GetRole(Guid id)
        {
            var role = await _roleManager.FindByIdAsync(id.ToString());
            if (role == null) return null;

            return new RoleDTO
            {
                Id = role.Id,
                Name = role.Name,
                // RoleDTO'da alan adı 'CratedDate' olarak geçmiş; değiştireceksen burada da güncelle.
                CratedDate = role.CreatedDate,
                Status = role.Status
            };
        }

        public async Task<List<RoleDTO>> GetRoles()
        {
            return await _roleManager.Roles
                .Where(r => r.Status != Status.Deleted)
                .OrderBy(r => r.Name)
                .Select(r => new RoleDTO
                {
                    Id = r.Id,
                    Name = r.Name,
                    CratedDate = r.CreatedDate, // DTO alan adınla uyumlu
                    Status = r.Status
                })
                .ToListAsync();
        }

        public async Task RenameRole(Guid id, string newName)
        {
            if (string.IsNullOrWhiteSpace(newName))
                throw new ArgumentException("Yeni rol adı boş olamaz.");

            var role = await _roleManager.FindByIdAsync(id.ToString())
                ?? throw new KeyNotFoundException("Rol bulunamadı.");

            var dup = await _roleManager.FindByNameAsync(newName.Trim());
            if (dup != null && dup.Id != id && dup.Status != Status.Deleted)
                throw new InvalidOperationException("Bu isim başka bir rolde kullanımda.");

            role.Name = newName.Trim();
            role.ModifiedDate = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }

        public async Task RestoreRole(Guid id)
        {
            var role = await _roleManager.FindByIdAsync(id.ToString())
                ?? throw new KeyNotFoundException("Rol bulunamadı.");

            if (role.Status != Status.Deleted) return;

            // Aynı isim yeniden aktiflenirken çakışma varsa engelle
            var dup = await _roleManager.FindByNameAsync(role.Name);
            if (dup != null && dup.Id != id && dup.Status != Status.Deleted)
                throw new InvalidOperationException("Aynı isimde aktif rol mevcut, geri yüklenemiyor.");

            role.Status = Status.Active;
            role.ModifiedDate = DateTime.UtcNow;

            var result = await _roleManager.UpdateAsync(role);
            if (!result.Succeeded)
                throw new Exception(string.Join(" | ", result.Errors.Select(e => e.Description)));
        }
    }
}
