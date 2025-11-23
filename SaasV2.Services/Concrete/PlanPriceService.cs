// PlanPriceService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.PlanPriceDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class PlanPriceService : IPlanPriceService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<PlanPrice> _repo;

        public PlanPriceService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<PlanPrice>();
        }

        public async Task<PlanPriceDTO> SetCurrentAsync(PlanPriceAddDTO dto)
        {
            if (dto.PlanId == Guid.Empty) throw new ArgumentException("PlanId zorunlu.");
            if (dto.Amount < 0) throw new ArgumentException("Amount negatif olamaz.");

            var now = DateTime.UtcNow;
            var effFrom = dto.EffectiveFrom == default ? now : dto.EffectiveFrom;

            // Aynı plan+currency için mevcut current'ı kapat
            var qCurrent = await _repo.GetBy(x =>
                 x.PlanId == dto.PlanId &&
                 x.Currency == dto.Currency &&
                 x.IsCurrent == true &&
                 x.Status != Status.Deleted
            );

            var current = await qCurrent.FirstOrDefaultAsync();
            if (current is not null)
            {
                current.IsCurrent = false;
                // Eğer yeni fiyat hemen yürürlükteyse, eskisinin EffectiveTo'su yeni begin'e kapanır
                current.EffectiveTo = effFrom > current.EffectiveFrom ? effFrom : now;
                current.ModifiedDate = now;
                await _repo.Update(current);
            }

            // Yeni satır
            var entity = dto.Adapt<PlanPrice>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            entity.EffectiveFrom = effFrom;

            // Geleceğe tarihliyse current değildir
            entity.IsCurrent = effFrom <= now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return entity.Adapt<PlanPriceDTO>();
        }

        public async Task Add(PlanPriceAddDTO dto)
        {
            // Basit ekleme istersen; ama pratikte SetCurrentAsync kullan
            await SetCurrentAsync(dto);
        }

        public async Task Update(PlanPriceUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("PlanPrice bulunamadı.");

            // Eğer IsCurrent true yapılmak isteniyorsa, diğer current'ı kapat
            var makeCurrent = dto.IsCurrent;
            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            if (makeCurrent)
            {
                var qOthers = await _repo.GetBy(x =>
                     x.PlanId == entity.PlanId &&
                     x.Currency == entity.Currency &&
                     x.Id != entity.Id &&
                     x.IsCurrent == true &&
                     x.Status != Status.Deleted
                );

                var other = await qOthers.FirstOrDefaultAsync();
                if (other is not null)
                {
                    other.IsCurrent = false;
                    other.EffectiveTo = entity.EffectiveFrom > other.EffectiveFrom ? entity.EffectiveFrom : DateTime.UtcNow;
                    other.ModifiedDate = DateTime.UtcNow;
                    await _repo.Update(other);
                }
            }

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("PlanPrice bulunamadı.");
            await _repo.Delete(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<PlanPriceDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.IsCurrent)
                          .ThenByDescending(x => x.EffectiveFrom)
                          .ProjectToType<PlanPriceDTO>()
                          .ToListAsync();
        }

        public async Task<PlanPriceDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id) ?? throw new KeyNotFoundException("PlanPrice bulunamadı.");
            return entity.Adapt<PlanPriceDTO>();
        }

        public async Task<List<PlanPriceDTO>> GetPricesAsync(Guid planId)
        {
            var q = await _repo.GetBy(x => x.PlanId == planId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.IsCurrent)
                          .ThenByDescending(x => x.EffectiveFrom)
                          .ProjectToType<PlanPriceDTO>()
                          .ToListAsync();
        }

        public async Task<PlanPriceDTO> GetCurrentAsync(Guid planId, CurrencyCode currency)
        {
            var q = await _repo.GetBy(x =>
                x.PlanId == planId &&
                x.Currency == currency &&
                x.IsCurrent == true &&
                x.Status != Status.Deleted);

            var entity = await q.AsNoTracking().FirstOrDefaultAsync()
                         ?? throw new KeyNotFoundException("Geçerli fiyat bulunamadı.");
            return entity.Adapt<PlanPriceDTO>();
        }
    }
}
