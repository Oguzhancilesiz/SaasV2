namespace SaasV2.DTOs.AppDTOs
{
    public class AppDashboardSummaryDTO
    {
        public Guid AppId { get; set; }

        // Plans
        public int PlansActive { get; set; }
        public int PlansInactive { get; set; }
        public decimal? CheapestPrice { get; set; }
        public string? CheapestPriceCurrency { get; set; }
        public decimal? HighestPrice { get; set; }
        public string? HighestPriceCurrency { get; set; }

        // Subscriptions
        public int SubscriptionsTotal { get; set; }
        public int SubscriptionsActive { get; set; }

        // Revenue (last 30 days)
        public decimal? RevenueLast30d { get; set; }
        public string? RevenueCurrency { get; set; }

        // API Keys
        public int ApiKeysActive { get; set; }
        public DateTime? LatestApiKeyCreated { get; set; }
        public string? LatestApiKeyMasked { get; set; }

        // Webhooks
        public int WebhookEndpointsActive { get; set; }
        public DateTime? LastWebhookDeliveryAt { get; set; }
        public string? LastWebhookDeliveryStatus { get; set; }

        // Usage
        public long UsageEventsLast7d { get; set; }

        // Registrations (isteğe bağlı)
        public int RegistrationsLast7d { get; set; }
    }
}
