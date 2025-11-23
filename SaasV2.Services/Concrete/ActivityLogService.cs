using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.DTOs.ActivityLogDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class ActivityLogService : IActivityLogService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<ActivityLog> _logRepo;
        private readonly IBaseRepository<AppUser> _userRepo;
        private readonly IBaseRepository<App> _appRepo;

        public ActivityLogService(IUnitOfWork uow)
        {
            _uow = uow;
            _logRepo = _uow.Repository<ActivityLog>();
            _userRepo = _uow.Repository<AppUser>();
            _appRepo = _uow.Repository<App>();
        }

        public async Task<List<ActivityLogDTO>> GetAll()
        {
            var q = await _logRepo.GetAllActives();
            var logs = await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ToListAsync();

            var userIds = logs.Where(l => l.UserId.HasValue).Select(l => l.UserId.Value).Distinct().ToList();
            var appIds = logs.Where(l => l.AppId.HasValue).Select(l => l.AppId.Value).Distinct().ToList();

            var users = userIds.Any() 
                ? await (await _userRepo.GetBy(u => userIds.Contains(u.Id))).AsNoTracking().ToListAsync()
                : new List<AppUser>();
            var apps = appIds.Any()
                ? await (await _appRepo.GetBy(a => appIds.Contains(a.Id))).AsNoTracking().ToListAsync()
                : new List<App>();

            return logs.Select(log => new ActivityLogDTO
            {
                Id = log.Id,
                Status = log.Status,
                CreatedDate = log.CreatedDate,
                ModifiedDate = log.ModifiedDate,
                AutoID = log.AutoID,
                UserId = log.UserId,
                UserName = log.UserId.HasValue ? users.FirstOrDefault(u => u.Id == log.UserId.Value)?.UserName : null,
                UserEmail = log.UserId.HasValue ? users.FirstOrDefault(u => u.Id == log.UserId.Value)?.Email : null,
                AppId = log.AppId,
                AppName = log.AppId.HasValue ? apps.FirstOrDefault(a => a.Id == log.AppId.Value)?.Name : null,
                AppCode = log.AppId.HasValue ? apps.FirstOrDefault(a => a.Id == log.AppId.Value)?.Code : null,
                Action = log.Action,
                EntityType = log.EntityType,
                EntityId = log.EntityId,
                Description = log.Description,
                OldValues = log.OldValues,
                NewValues = log.NewValues,
                IpAddress = log.IpAddress,
                UserAgent = log.UserAgent,
                RequestId = log.RequestId,
            }).ToList();
        }

        public async Task<ActivityLogDTO> GetById(Guid id)
        {
            var entity = await _logRepo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Activity log bulunamadı.");
            
            var dto = entity.Adapt<ActivityLogDTO>();
            
            if (entity.UserId.HasValue)
            {
                var user = await _userRepo.GetById(entity.UserId.Value, ignoreQueryFilter: true);
                if (user != null)
                {
                    dto.UserName = user.UserName;
                    dto.UserEmail = user.Email;
                }
            }
            
            if (entity.AppId.HasValue)
            {
                var app = await _appRepo.GetById(entity.AppId.Value, ignoreQueryFilter: true);
                if (app != null)
                {
                    dto.AppName = app.Name;
                    dto.AppCode = app.Code;
                }
            }
            
            return dto;
        }

        public async Task<List<ActivityLogDTO>> GetByUser(Guid userId)
        {
            var q = await _logRepo.GetBy(x => x.UserId == userId);
            return await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ProjectToType<ActivityLogDTO>()
                .ToListAsync();
        }

        public async Task<List<ActivityLogDTO>> GetByApp(Guid appId)
        {
            var q = await _logRepo.GetBy(x => x.AppId == appId);
            return await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ProjectToType<ActivityLogDTO>()
                .ToListAsync();
        }

        public async Task<List<ActivityLogDTO>> GetByEntity(string entityType, Guid? entityId = null)
        {
            var q = await _logRepo.GetBy(x => 
                x.EntityType == entityType && 
                (entityId == null || x.EntityId == entityId));
            return await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ProjectToType<ActivityLogDTO>()
                .ToListAsync();
        }

        public async Task<List<ActivityLogDTO>> GetByAction(string action)
        {
            var q = await _logRepo.GetBy(x => x.Action == action);
            return await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .ProjectToType<ActivityLogDTO>()
                .ToListAsync();
        }

        public async Task<List<ActivityLogDTO>> GetRecent(int take = 100)
        {
            var q = await _logRepo.GetAllActives();
            return await q
                .AsNoTracking()
                .OrderByDescending(x => x.CreatedDate)
                .Take(take)
                .ProjectToType<ActivityLogDTO>()
                .ToListAsync();
        }
    }
}

