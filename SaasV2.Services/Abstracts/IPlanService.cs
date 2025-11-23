// IPlanService.cs
using SaasV2.DTOs.PlanDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IPlanService : IBaseService<PlanDTO, PlanAddDTO, PlanUpdateDTO>
    {
        Task<List<PlanDTO>> GetByAppIdAsync(Guid appId);
        Task<PlanDTO> GetByCodeAsync(Guid appId, string code);
        Task ToggleVisibilityAsync(Guid planId, bool isPublic);
        Task SetFreeAsync(Guid planId, bool isFree);
    }
}
