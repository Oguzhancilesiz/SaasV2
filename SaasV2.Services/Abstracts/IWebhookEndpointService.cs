using SaasV2.DTOs.WebhookDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IWebhookEndpointService : IBaseService<WebhookEndpointDTO, WebhookEndpointAddDTO, WebhookEndpointUpdateDTO>
    {
        Task<List<WebhookEndpointDTO>> GetByAppAsync(Guid appId);
        Task<List<WebhookEndpointDTO>> GetActiveByAppAndEventAsync(Guid appId, string eventType);
        Task RotateSecretAsync(Guid endpointId);   // güvenlik için
        Task ActivateAsync(Guid endpointId);
        Task DeactivateAsync(Guid endpointId);
        Task<WebhookEndpointDTO> TestPingAsync(Guid endpointId);  // test çağrısı gönder
    }
}
