using SaasV2.Core.Enums;

namespace SaasV2.DTOs.AppDTOs
{
    public class AppProvisionRequest
    {
        // App
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string? Description { get; set; }

        // Opsiyonel sahiplik vs (kullanırsan)
        public Guid? OwnerUserId { get; set; }
        public AppEnvironment? Environment { get; set; }
        public string? WorkspaceKey { get; set; }
        public string? OwnerContactEmail { get; set; }
        public string? BillingContactEmail { get; set; }
        public string? Notes { get; set; }

        // Planlar
        public List<PlanSeed> Plans { get; set; } = new();

        // API Key
        public bool CreateApiKey { get; set; } = true;
        public string ApiKeyName { get; set; } = "Default";
        public DateTime? ApiKeyExpiresAt { get; set; }

        // Webhook
        public bool CreateWebhook { get; set; } = false;
        public string? WebhookUrl { get; set; }         // ör: https://example.com/webhooks
        public string? WebhookSecret { get; set; }      // imzalama için (opsiyonel)
    }

    public class PlanSeed
    {
        public string Name { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string? Description { get; set; }

        public int TrialDays { get; set; }
        public int? GraceDays { get; set; }

        // Projendeki enum adı farklıysa uyarlarsın. DB’de Plan tablosunda "BillingInterval" kolonu var.
        public BillingPeriod? BillingInterval { get; set; }  // ör: Monthly, Yearly

        public bool Active { get; set; } = true;

        public List<PlanPriceSeed> Prices { get; set; } = new();
        public List<Guid> FeatureIds { get; set; } = new(); // Var olan Feature’ları iliştir
    }

    public class PlanPriceSeed
    {
        public CurrencyCode Currency { get; set; }      // enum (TRY, USD vs)
        public decimal Amount { get; set; }
        public DateTime? EffectiveFrom { get; set; }     // null ise now
    }
}
