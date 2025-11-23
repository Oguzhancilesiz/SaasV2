// PlanFeatureService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.PlanFeatureDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class PlanFeatureService : IPlanFeatureService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<PlanFeature> _repo;

        public PlanFeatureService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<PlanFeature>();
        }

        public async Task<PlanFeatureDTO> UpsertAsync(PlanFeatureAddDTO dto)
        {
            if (dto.PlanId == Guid.Empty || dto.FeatureId == Guid.Empty)
                throw new ArgumentException("PlanId ve FeatureId zorunlu.");

            var q = await _repo.GetBy(x => x.PlanId == dto.PlanId && x.FeatureId == dto.FeatureId);
            var existing = await q.FirstOrDefaultAsync();

            if (existing is null)
            {
                var now = DateTime.UtcNow;
                var entity = dto.Adapt<PlanFeature>();
                entity.Id = Guid.NewGuid();
                entity.Status = Status.Active;
                entity.CreatedDate = now;
                entity.ModifiedDate = now;

                await _repo.AddAsync(entity);
                await _uow.SaveChangesAsync();
                return entity.Adapt<PlanFeatureDTO>();
            }
            else
            {
                existing.Limit = dto.Limit;
                existing.ResetInterval = dto.ResetInterval;
                existing.AllowOverage = dto.AllowOverage;
                existing.OverusePrice = dto.OverusePrice;
                existing.ModifiedDate = DateTime.UtcNow;

                await _repo.Update(existing);
                await _uow.SaveChangesAsync();
                return existing.Adapt<PlanFeatureDTO>();
            }
        }

        public async Task Add(PlanFeatureAddDTO dto)
        {
            // unique constraint var; çakışmayı kibarca yakalayalım
            await UpsertAsync(dto);
        }

        public async Task Update(PlanFeatureUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("PlanFeature bulunamadı.");

            // Opsiyonel PlanId/FeatureId değişimi (Guid.Empty gönderildiyse koru)
            if (dto.PlanId != Guid.Empty) entity.PlanId = dto.PlanId;
            if (dto.FeatureId != Guid.Empty) entity.FeatureId = dto.FeatureId;

            entity.Limit = dto.Limit;
            entity.ResetInterval = dto.ResetInterval;
            entity.AllowOverage = dto.AllowOverage;
            entity.OverusePrice = dto.OverusePrice;
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("PlanFeature bulunamadı.");
            await _repo.Delete(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<PlanFeatureDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking().ProjectToType<PlanFeatureDTO>().ToListAsync();
        }

        public async Task<PlanFeatureDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id) ?? throw new KeyNotFoundException("PlanFeature bulunamadı.");
            return entity.Adapt<PlanFeatureDTO>();
        }

        public async Task<List<PlanFeatureDTO>> GetByPlanAsync(Guid planId)
        {
            var q = await _repo.GetBy(x => x.PlanId == planId && x.Status != Status.Deleted);
            return await q.AsNoTracking().ProjectToType<PlanFeatureDTO>().ToListAsync();
        }

        public async Task RemoveByFeatureAsync(Guid planId, Guid featureId)
        {
            var q = await _repo.GetBy(x => x.PlanId == planId && x.FeatureId == featureId && x.Status != Status.Deleted);
            var entity = await q.FirstOrDefaultAsync() ?? throw new KeyNotFoundException("Eşleşme bulunamadı.");
            await _repo.Delete(entity);
            await _uow.SaveChangesAsync();
        }
    }
}
