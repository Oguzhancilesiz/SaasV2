using SaasV2.DTOs.AppUserRegistrationDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IAppUserRegistrationService : IBaseService<AppUserRegistrationDTO, AppUserRegistrationAddDTO, AppUserRegistrationUpdateDTO>
    {
        Task<AppUserRegistrationDTO> GetByAppAndUserAsync(Guid appId, Guid userId);
        Task<List<AppUserRegistrationDTO>> GetByAppAsync(Guid appId);
        Task<List<AppUserRegistrationDTO>> GetByUserAsync(Guid userId);

        // Idempotent ekleme: varsa döner, yoksa oluşturur
        Task<AppUserRegistrationDTO> EnsureAsync(AppUserRegistrationAddDTO dto);

        // Dış sağlayıcıyla lookup (Apple/Google gibi)
        Task<AppUserRegistrationDTO?> FindByExternalAsync(Guid appId, string provider, string externalId);
    }
}
