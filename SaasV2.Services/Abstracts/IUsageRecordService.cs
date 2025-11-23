using SaasV2.DTOs.UsageRecordDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IUsageRecordService : IBaseService<UsageRecordDTO, UsageRecordAddDTO, UsageRecordUpdateDTO>
    {
        /// <summary>
        /// Sadece idempotent kayıt yapar. Limit/abonelik enforcement yapmaz.
        /// dto.SubscriptionId boş ise aktif aboneliği bulmaya çalışmaz; gelen değer ne ise yazar.
        /// </summary>
        Task<UsageRecordDTO> TrackAsync(UsageRecordAddDTO dto);

        /// <summary>
        /// Aktif aboneliği bulur, SubscriptionItem'ı reset kurallarına göre günceller,
        /// limit aşımı kontrolü yapar, idempotent olarak Usage kaydeder.
        /// Limit aşımı ve overage politikasına göre exception fırlatabilir.
        /// </summary>
        Task<UsageRecordDTO> EnforceAndTrackAsync(
            Guid appId,
            Guid userId,
            Guid featureId,
            decimal quantity,
            string correlationId,
            DateTime? occurredAt = null,
            string metadataJson = null);

        /// <summary>
        /// Kullanıcının belirli bir App içindeki son N kullanımını getirir.
        /// </summary>
        Task<List<UsageRecordDTO>> GetRecentAsync(Guid appId, Guid userId, int take = 100);
    }
}
