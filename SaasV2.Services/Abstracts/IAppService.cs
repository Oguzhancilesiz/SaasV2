// IAppService.cs
using SaasV2.DTOs.AppDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IAppService : IBaseService<AppDTO, AppAddDTO, AppUpdateDTO>
    {
        Task<AppDTO> GetByCodeAsync(string slug);
        Task<AppFilterResponse> GetFilteredAsync(AppFilterRequest request);
    }
}
