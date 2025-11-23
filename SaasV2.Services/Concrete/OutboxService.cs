// OutboxService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.OutboxDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class OutboxService : IOutboxService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<OutboxMessage> _repo;

        public OutboxService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<OutboxMessage>();
        }

        #region Enqueue / Fetch / Process

        public async Task<OutboxMessageDTO> EnqueueAsync(OutboxMessageAddDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Type)) throw new ArgumentException("Type zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Payload)) throw new ArgumentException("Payload zorunlu.");

            var now = DateTime.UtcNow;

            var entity = dto.Adapt<OutboxMessage>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            entity.Retries = 0;
            entity.ProcessedAt = null;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return entity.Adapt<OutboxMessageDTO>();
        }

        public async Task<List<OutboxMessageDTO>> GetPendingAsync(int take = 100, DateTime? olderThanUtc = null)
        {
            if (take <= 0) take = 100;
            var cutoff = olderThanUtc ?? DateTime.UtcNow;

            var q = await _repo.GetBy(x =>
                x.Status != Status.Deleted &&
                x.ProcessedAt == null &&
                x.OccurredAt <= cutoff
            );

            var list = await q.AsNoTracking()
                              .OrderBy(x => x.OccurredAt)
                              .ThenBy(x => x.AutoID) // deterministic
                              .Take(take)
                              .ProjectToType<OutboxMessageDTO>()
                              .ToListAsync();

            return list;
        }

        public async Task MarkProcessedAsync(Guid id, DateTime? processedAtUtc = null)
        {
            var item = await _repo.GetById(id, ignoreQueryFilter: true)
                       ?? throw new KeyNotFoundException("Outbox kayıt bulunamadı.");

            if (item.Status == Status.Deleted) return;

            item.ProcessedAt = processedAtUtc ?? DateTime.UtcNow;
            item.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(item);
            await _uow.SaveChangesAsync();
        }

        public async Task<int> IncrementRetryAsync(Guid id)
        {
            var item = await _repo.GetById(id, ignoreQueryFilter: true)
                       ?? throw new KeyNotFoundException("Outbox kayıt bulunamadı.");

            item.Retries++;
            item.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(item);
            await _uow.SaveChangesAsync();
            return item.Retries;
        }

        public async Task<int> CleanupProcessedAsync(DateTime olderThanUtc)
        {
            // Çok eski ve işlenmiş olanları soft-delete’e al
            var q = await _repo.GetBy(x =>
                x.Status != Status.Deleted &&
                x.ProcessedAt != null &&
                x.ProcessedAt < olderThanUtc
            );

            var toDelete = await q.ToListAsync();
            foreach (var e in toDelete)
                await _repo.Delete(e);

            await _uow.SaveChangesAsync();
            return toDelete.Count;
        }

        #endregion

        #region IBaseService glue

        public async Task Add(OutboxMessageAddDTO dto)
        {
            await EnqueueAsync(dto);
        }

        public async Task Update(OutboxMessageUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Outbox kayıt bulunamadı.");

            // Tip ve payload değişmez; Mapster config zaten ignore ediyor
            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Outbox kayıt bulunamadı.");

            await _repo.Delete(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<OutboxMessageDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking().ProjectToType<OutboxMessageDTO>().ToListAsync();
        }

        public async Task<OutboxMessageDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id)
                         ?? throw new KeyNotFoundException("Outbox kayıt bulunamadı.");

            return entity.Adapt<OutboxMessageDTO>();
        }

        #endregion
    }
}
