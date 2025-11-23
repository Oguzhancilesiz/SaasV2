// IApiKeyService.cs
using SaasV2.DTOs.ApiKeyDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IApiKeyService : IBaseService<ApiKeyDTO, ApiKeyAddDTO, ApiKeyUpdateDTO>
    {
        Task<List<ApiKeyDTO>> GetByAppAsync(Guid appId, bool includeExpired = false, bool includeDeleted = false);
        Task<ApiKeyDTO> GetByPrefixAsync(Guid appId, string prefix);
        Task<bool> ValidateAsync(Guid appId, string prefix, string hash); // aktif mi, süresi dolmamış mı, hash eşleşiyor mu
        Task RevokeAsync(Guid id);                                        // hızlı kapatma: ExpiresAt = now
        Task TouchLastUsedAsync(Guid id);                                  // LastUsedAt = now
    }
}
