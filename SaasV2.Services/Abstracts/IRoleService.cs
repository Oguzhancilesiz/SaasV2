using SaasV2.DTOs.RoleDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IRoleService
    {
        Task AddRole(RoleAddDTO role);
        Task DeleteRole(Guid id);                 // soft delete
        Task<List<RoleDTO>> GetRoles();
        Task<RoleDTO?> GetRole(Guid id);
        Task RenameRole(Guid id, string newName); // opsiyonel ama faydalı
        Task RestoreRole(Guid id);                // silineni geri almak istersen
    }
}
