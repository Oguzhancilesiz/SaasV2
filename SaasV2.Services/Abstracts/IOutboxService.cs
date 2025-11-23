// IOutboxService.cs
using SaasV2.DTOs.OutboxDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IOutboxService : IBaseService<OutboxMessageDTO, OutboxMessageAddDTO, OutboxMessageUpdateDTO>
    {
        // Kuyruğa yeni kayıt
        Task<OutboxMessageDTO> EnqueueAsync(OutboxMessageAddDTO dto);

        // İşlenmemiş kayıtları sırayla çek (FIFO). processedAt == null + Status != Deleted
        Task<List<OutboxMessageDTO>> GetPendingAsync(int take = 100, DateTime? olderThanUtc = null);

        // Tek tek başarıyla işlendi say
        Task MarkProcessedAsync(Guid id, DateTime? processedAtUtc = null);

        // Başarısız işlendi: retry sayısını artır (basit backoff mantığı buradan yönetilebilir)
        Task<int> IncrementRetryAsync(Guid id);

        // Bakım: çok eski/işlenmişleri soft-delete et
        Task<int> CleanupProcessedAsync(DateTime olderThanUtc);
    }
}
