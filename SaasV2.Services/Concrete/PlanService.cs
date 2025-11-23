// PlanService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.PlanDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class PlanService : IPlanService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Plan> _repo;

        public PlanService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<Plan>();
        }

        public async Task Add(PlanAddDTO dto)
        {
            if (dto.AppId == Guid.Empty) throw new ArgumentException("AppId zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Code)) throw new ArgumentException("Code zorunlu.");

            var exists = await _repo.AnyAsync(x => x.AppId == dto.AppId && (x.Code == dto.Code || x.Name == dto.Name));
            if (exists) throw new InvalidOperationException("Aynı App için aynı Code/Name kullanılamaz.");

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<Plan>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(PlanUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Plan bulunamadı.");

            if (!string.IsNullOrWhiteSpace(dto.Code) && dto.Code != entity.Code)
            {
                var clash = await _repo.AnyAsync(x => x.AppId == entity.AppId && x.Code == dto.Code && x.Id != dto.Id);
                if (clash) throw new InvalidOperationException("Code kullanımda.");
            }

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Plan bulunamadı.");
            await _repo.Delete(entity); // soft delete
            await _uow.SaveChangesAsync();
        }

        public async Task<List<PlanDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking().ProjectToType<PlanDTO>().ToListAsync();
        }

        public async Task<PlanDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id) ?? throw new KeyNotFoundException("Plan bulunamadı.");
            return entity.Adapt<PlanDTO>();
        }

        public async Task<List<PlanDTO>> GetByAppIdAsync(Guid appId)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);
            return await q.AsNoTracking().OrderBy(x => x.Name).ProjectToType<PlanDTO>().ToListAsync();
        }

        public async Task<PlanDTO> GetByCodeAsync(Guid appId, string code)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.Code == code && x.Status != Status.Deleted);
            var entity = await q.AsNoTracking().FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Plan bulunamadı.");
            return entity.Adapt<PlanDTO>();
        }

        public async Task ToggleVisibilityAsync(Guid planId, bool isPublic)
        {
            var entity = await _repo.GetById(planId, ignoreQueryFilter: true) ?? throw new KeyNotFoundException("Plan bulunamadı.");
            entity.IsPublic = isPublic;
            entity.ModifiedDate = DateTime.UtcNow;
            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task SetFreeAsync(Guid planId, bool isFree)
        {
            var entity = await _repo.GetById(planId, ignoreQueryFilter: true) ?? throw new KeyNotFoundException("Plan bulunamadı.");
            entity.IsFree = isFree;
            entity.ModifiedDate = DateTime.UtcNow;
            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }
    }
}
