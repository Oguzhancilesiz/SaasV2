using SaasV2.Core.Enums;

namespace SaasV2.Entity
{
    public class SubscriptionChangeLog : BaseEntity
    {
        public Guid SubscriptionId { get; set; }
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }

        public SubscriptionChangeType ChangeType { get; set; }

        public Guid? OldPlanId { get; set; }
        public Guid? NewPlanId { get; set; }
        public Guid? InvoiceId { get; set; }

        public Guid? TriggeredByUserId { get; set; }
        public DateTime EffectiveDate { get; set; }

        public decimal? OldAmount { get; set; }
        public decimal? NewAmount { get; set; }
        public CurrencyCode? Currency { get; set; }

        public string? Reason { get; set; }
        public string? Metadata { get; set; }
    }
}

