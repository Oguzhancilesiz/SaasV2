using SaasV2.DTOs.WebhookDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IWebhookDeliveryService : IBaseService<WebhookDeliveryDTO, WebhookDeliveryAddDTO, WebhookDeliveryUpdateDTO>
    {
        /// <summary>
        /// Tek bir endpoint’e olay gönder ve sonucu logla. İmza ve idempotent header’ları ekler.
        /// </summary>
        Task<WebhookDeliveryDTO> SendToEndpointAsync(Guid endpointId, string eventType, string payloadJson, string idempotencyKey = null, DateTime? occurredAt = null);

        /// <summary>
        /// Uygulamadaki ilgili event’i tüm aktif endpoint’lere dağıt.
        /// </summary>
        Task<List<WebhookDeliveryDTO>> BroadcastAsync(Guid appId, string eventType, string payloadJson, string idempotencyKey = null, DateTime? occurredAt = null);

        /// <summary>
        /// Başarısız (5xx/timeout) teslimleri yeniden dene.
        /// </summary>
        Task<int> RetryFailedAsync(Guid endpointId, int maxAttempts = 3);

        /// <summary>
        /// Outbox kullanmak istersen: outbox’a düş ve worker göndersin.
        /// </summary>
        Task EnqueueOutboxAsync(Guid? appId, string eventType, string payloadJson, DateTime? occurredAt = null);
    }
}
