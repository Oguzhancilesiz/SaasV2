// IPlanPriceService.cs
using SaasV2.Core.Enums;
using SaasV2.DTOs.PlanPriceDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IPlanPriceService : IBaseService<PlanPriceDTO, PlanPriceAddDTO, PlanPriceUpdateDTO>
    {
        Task<List<PlanPriceDTO>> GetPricesAsync(Guid planId);
        Task<PlanPriceDTO> GetCurrentAsync(Guid planId, CurrencyCode currency);
        Task<PlanPriceDTO> SetCurrentAsync(PlanPriceAddDTO dto); // versiyonlama yapar
    }
}
