namespace SaasV2.DTOs.AppDTOs
{
    public class AppProvisionResult
    {
        public Guid AppId { get; set; }
        public List<Guid> PlanIds { get; set; } = new();

        // API key - raw değeri yalnızca ilk ve tek kez döndür.
        public bool ApiKeyCreated { get; set; }
        public string? ApiKeyRaw { get; set; }        // sadece göstermek için
        public string? ApiKeyMasked { get; set; }     // prefix bazlı maske
        public DateTime? ApiKeyExpiresAt { get; set; }

        public bool WebhookCreated { get; set; }
        public Guid? WebhookEndpointId { get; set; }
    }
}
