// IFeatureService.cs
using SaasV2.DTOs.FeatureDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IFeatureService : IBaseService<FeatureDTO, FeatureAddDTO, FeatureUpdateDTO>
    {
        Task<FeatureDTO> GetByKeyAsync(Guid appId, string key);
        Task<List<FeatureDTO>> GetByAppAsync(Guid appId);
        Task<List<FeatureDTO>> SearchAsync(Guid appId, string q); // name/key contains
        Task<FeatureDTO> EnsureAsync(FeatureAddDTO dto);          // idempotent ekleme
    }
}
