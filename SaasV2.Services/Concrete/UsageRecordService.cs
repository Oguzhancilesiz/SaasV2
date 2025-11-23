using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.UsageRecordDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class UsageRecordService : IUsageRecordService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<UsageRecord> _usageRepo;
        private readonly IBaseRepository<Subscription> _subRepo;
        private readonly IBaseRepository<SubscriptionItem> _itemRepo;
        private readonly IBaseRepository<Plan> _planRepo;
        private readonly IBaseRepository<PlanFeature> _pfRepo;

        public UsageRecordService(IUnitOfWork uow)
        {
            _uow = uow;
            _usageRepo = _uow.Repository<UsageRecord>();
            _subRepo = _uow.Repository<Subscription>();
            _itemRepo = _uow.Repository<SubscriptionItem>();
            _planRepo = _uow.Repository<Plan>();
            _pfRepo = _uow.Repository<PlanFeature>();
        }

        #region IBaseService
        public async Task Add(UsageRecordAddDTO dto)
        {
            _ = await TrackAsync(dto);
        }

        public async Task Update(UsageRecordUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _usageRepo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Usage bulunamadı.");

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _usageRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _usageRepo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Usage bulunamadı.");

            // Soft delete
            entity.Status = Status.Deleted;
            entity.ModifiedDate = DateTime.UtcNow;

            await _usageRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<UsageRecordDTO>> GetAll()
        {
            var q = await _usageRepo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.OccurredAt)
                          .ProjectToType<UsageRecordDTO>()
                          .ToListAsync();
        }

        public async Task<UsageRecordDTO> GetById(Guid id)
        {
            var entity = await _usageRepo.GetById(id)
                         ?? throw new KeyNotFoundException("Usage bulunamadı.");
            return entity.Adapt<UsageRecordDTO>();
        }
        #endregion

        #region Track / Enforce
        public async Task<UsageRecordDTO> TrackAsync(UsageRecordAddDTO dto)
        {
            ValidateBasic(dto.AppId, dto.UserId, dto.FeatureId, dto.Quantity, dto.CorrelationId);

            // Idempotency: aynı (AppId, UserId, CorrelationId) varsa geri dön
            var existingQ = await _usageRepo.GetBy(x =>
                x.AppId == dto.AppId &&
                x.UserId == dto.UserId &&
                x.CorrelationId == dto.CorrelationId &&
                x.Status != Status.Deleted);

            var existing = await existingQ.AsNoTracking().FirstOrDefaultAsync();
            if (existing is not null)
                return existing.Adapt<UsageRecordDTO>();

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<UsageRecord>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            entity.OccurredAt = dto.OccurredAt == default ? now : dto.OccurredAt;

            await _usageRepo.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return entity.Adapt<UsageRecordDTO>();
        }

        public async Task<UsageRecordDTO> EnforceAndTrackAsync(
            Guid appId,
            Guid userId,
            Guid featureId,
            decimal quantity,
            string correlationId,
            DateTime? occurredAt = null,
            string metadataJson = null)
        {
            ValidateBasic(appId, userId, featureId, quantity, correlationId);

            // Idempotency check upfront
            var dupQ = await _usageRepo.GetBy(x =>
                x.AppId == appId &&
                x.UserId == userId &&
                x.CorrelationId == correlationId &&
                x.Status != Status.Deleted);

            var dup = await dupQ.AsNoTracking().FirstOrDefaultAsync();
            if (dup is not null) return dup.Adapt<UsageRecordDTO>();

            // Aktif aboneliği bul
            var activeSubQ = await _subRepo.GetBy(x =>
                x.AppId == appId &&
                x.UserId == userId &&
                x.Status != Status.Deleted &&
                (x.EndAt == null || x.EndAt > DateTime.UtcNow));

            var sub = await activeSubQ.AsNoTracking()
                                      .OrderByDescending(x => x.CreatedDate)
                                      .FirstOrDefaultAsync();

            if (sub is null)
                throw new InvalidOperationException("Aktif abonelik bulunamadı.");

            // Aboneliğin bu feature'ı için item bul / yoksa oluştur
            var itemQ = await _itemRepo.GetBy(x =>
                x.SubscriptionId == sub.Id &&
                x.FeatureId == featureId &&
                x.Status != Status.Deleted);

            var item = await itemQ.FirstOrDefaultAsync();
            if (item is null)
            {
                // PlanFeature'ı çek, item oluştur
                var pfQ = await _pfRepo.GetBy(x => x.PlanId == sub.PlanId && x.FeatureId == featureId && x.Status != Status.Deleted);
                var pf = await pfQ.AsNoTracking().FirstOrDefaultAsync()
                         ?? throw new InvalidOperationException("Plan bu özelliği içermiyor.");

                item = new SubscriptionItem
                {
                    Id = Guid.NewGuid(),
                    Status = Status.Active,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                    SubscriptionId = sub.Id,
                    FeatureId = featureId,
                    Allotted = pf.Limit,
                    Used = 0m,
                    ResetsAt = CalcResetAt(sub.StartAt, pf.ResetInterval)
                };
                await _itemRepo.AddAsync(item);
                await _uow.SaveChangesAsync();
            }

            // Reset zamanı geldiyse sayaçları sıfırla
            if (item.ResetsAt.HasValue && item.ResetsAt.Value <= DateTime.UtcNow)
            {
                var pfQ2 = await _pfRepo.GetBy(x => x.PlanId == sub.PlanId && x.FeatureId == featureId && x.Status != Status.Deleted);
                var pf2 = await pfQ2.AsNoTracking().FirstOrDefaultAsync()
                          ?? throw new InvalidOperationException("Plan özelliği bulunamadı.");
                item.Used = 0m;
                item.Allotted = pf2.Limit;
                item.ResetsAt = CalcResetAt(item.ResetsAt.Value, pf2.ResetInterval);
                item.ModifiedDate = DateTime.UtcNow;
                await _itemRepo.Update(item);
                await _uow.SaveChangesAsync();
            }

            // Limit enforcement
            var pfQ3 = await _pfRepo.GetBy(x => x.PlanId == sub.PlanId && x.FeatureId == featureId && x.Status != Status.Deleted);
            var pf3 = await pfQ3.AsNoTracking().FirstOrDefaultAsync()
                      ?? throw new InvalidOperationException("Plan özelliği bulunamadı.");

            if (item.Allotted.HasValue)
            {
                var remaining = item.Allotted.Value - item.Used;
                if (quantity > remaining && !pf3.AllowOverage)
                {
                    // Burada throttle edersin
                    throw new InvalidOperationException($"Limit aşıldı. Kalan: {remaining}, talep: {quantity}.");
                }
            }

            // Usage kaydı + sayaç güncelle
            var now = DateTime.UtcNow;
            var record = new UsageRecord
            {
                Id = Guid.NewGuid(),
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now,
                AppId = appId,
                UserId = userId,
                SubscriptionId = sub.Id,
                FeatureId = featureId,
                Quantity = quantity,
                OccurredAt = occurredAt ?? now,
                CorrelationId = correlationId,
                MetadataJson = metadataJson
            };

            await _usageRepo.AddAsync(record);

            item.Used += quantity;
            item.ModifiedDate = now;
            await _itemRepo.Update(item);

            await _uow.SaveChangesAsync();

            return record.Adapt<UsageRecordDTO>();
        }
        #endregion

        #region Queries
        public async Task<List<UsageRecordDTO>> GetRecentAsync(Guid appId, Guid userId, int take = 100)
        {
            var q = await _usageRepo.GetBy(x => x.AppId == appId && x.UserId == userId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.OccurredAt)
                          .Take(Math.Clamp(take, 1, 1000))
                          .ProjectToType<UsageRecordDTO>()
                          .ToListAsync();
        }
        #endregion

        #region Helpers
        private static void ValidateBasic(Guid appId, Guid userId, Guid featureId, decimal qty, string correlationId)
        {
            if (appId == Guid.Empty) throw new ArgumentException("AppId zorunlu.");
            if (userId == Guid.Empty) throw new ArgumentException("UserId zorunlu.");
            if (featureId == Guid.Empty) throw new ArgumentException("FeatureId zorunlu.");
            if (qty <= 0) throw new ArgumentException("Quantity pozitif olmalı.");
            if (string.IsNullOrWhiteSpace(correlationId)) throw new ArgumentException("CorrelationId zorunlu.");
        }

        private static DateTime? CalcResetAt(DateTime from, ResetInterval interval)
        {
            return interval switch
            {
                ResetInterval.Daily => from.Date.AddDays(1),
                ResetInterval.Weekly => from.Date.AddDays(7),
                ResetInterval.Monthly => from.AddMonths(1),
                ResetInterval.Yearly => from.AddYears(1),
                ResetInterval.OneTime => null,
                ResetInterval.Unlimited => null,
                _ => null
            };
        }
        #endregion
    }
}
