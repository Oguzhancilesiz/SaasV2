using SaasV2.DTOs.AppDTOs;

public interface IAppCompositeService
{
    Task<AppProvisionResult> ProvisionAsync(AppProvisionRequest request);
    Task<AppDashboardSummaryDTO> GetAppDashboardAsync(Guid appId);
    Task<List<AppDashboardSummaryDTO>> GetAppDashboardBatchAsync(IEnumerable<Guid> appIds);
}
