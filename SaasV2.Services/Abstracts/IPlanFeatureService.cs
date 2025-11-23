// IPlanFeatureService.cs
using SaasV2.DTOs.PlanFeatureDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IPlanFeatureService : IBaseService<PlanFeatureDTO, PlanFeatureAddDTO, PlanFeatureUpdateDTO>
    {
        Task<List<PlanFeatureDTO>> GetByPlanAsync(Guid planId);
        Task RemoveByFeatureAsync(Guid planId, Guid featureId);
        Task<PlanFeatureDTO> UpsertAsync(PlanFeatureAddDTO dto); // plan+feature unique: varsa güncelle, yoksa ekle
    }
}
