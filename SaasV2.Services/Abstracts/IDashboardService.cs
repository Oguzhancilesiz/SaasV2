using SaasV2.DTOs.DashboardDTOs;
using System;
using System.Threading.Tasks;

namespace SaasV2.Services.Abstracts
{
    public interface IDashboardService
    {
        Task<GlobalDashboardDTO> GetGlobalDashboardAsync();
        Task<UserDashboardDTO> GetUserDashboardAsync(Guid userId);
        Task<UserDashboardDTO> GetUserDashboardByEmailAsync(string email);
        Task<AppDashboardDTO> GetAppDashboardAsync(Guid appId);
    }
}
