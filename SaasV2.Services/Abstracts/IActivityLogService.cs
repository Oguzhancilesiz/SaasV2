using SaasV2.DTOs.ActivityLogDTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaasV2.Services.Abstracts
{
    public interface IActivityLogService
    {
        Task<List<ActivityLogDTO>> GetAll();
        Task<ActivityLogDTO> GetById(Guid id);
        Task<List<ActivityLogDTO>> GetByUser(Guid userId);
        Task<List<ActivityLogDTO>> GetByApp(Guid appId);
        Task<List<ActivityLogDTO>> GetByEntity(string entityType, Guid? entityId = null);
        Task<List<ActivityLogDTO>> GetByAction(string action);
        Task<List<ActivityLogDTO>> GetRecent(int take = 100);
    }
}

