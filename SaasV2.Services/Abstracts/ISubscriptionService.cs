// ISubscriptionService.cs
using SaasV2.DTOs.SubscriptionDTOs;
using SaasV2.DTOs.SubscriptionItemDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface ISubscriptionService : IBaseService<SubscriptionDTO, SubscriptionAddDTO, SubscriptionUpdateDTO>
    {
        // İş akışları
        Task<SubscriptionDTO> StartAsync(SubscriptionAddDTO dto, Guid? triggeredByUserId = null, string? reason = null);                 // Tek-aktif kuralıyla başlatır ve SubscriptionItem’ları oluşturur
        Task<SubscriptionDTO> ChangePlanAsync(Guid subscriptionId, Guid newPlanId, Guid? triggeredByUserId = null, string? reason = null); // Mevcut aboneliği kapatıp yeni planla yenisini açar
        Task CancelAsync(Guid subscriptionId, DateTime? endAt = null, Guid? triggeredByUserId = null, string? reason = null);            // Soft delete + EndAt

        // Sorgular
        Task<SubscriptionDTO?> GetActiveAsync(Guid appId, Guid userId);
        Task<List<SubscriptionDTO>> GetByUserAsync(Guid userId);
        Task<List<SubscriptionDTO>> GetByAppAsync(Guid appId);
        Task<List<SubscriptionChangeLogDTO>> GetChangeHistoryAsync(Guid subscriptionId);

        // Sayaç (SubscriptionItem) yardımcıları
        Task RebuildItemsFromPlanAsync(Guid subscriptionId);                      // PlanFeature'ları tekrar uygula
        Task<List<SubscriptionItemDTO>> GetItemsAsync(Guid subscriptionId);        // SubscriptionItem'ları getir
    }
}
