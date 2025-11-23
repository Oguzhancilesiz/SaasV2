using SaasV2.Core.Enums;

namespace SaasV2.Entity
{
    // Kullanıcının bir App içindeki plan aboneliği
    public class Subscription : BaseEntity
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }      // AppUser.Id
        public Guid PlanId { get; set; }

        public Guid? PlanPriceId { get; set; }          // Abonelik başlarken kullanılan fiyat kaydı
        public CurrencyCode Currency { get; set; } = CurrencyCode.TRY;
        public decimal UnitPrice { get; set; }

        public DateTime StartAt { get; set; }          // İlk başlangıç tarihi
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? EndAt { get; set; }          // Bitiş/iptal tarihi
        public DateTime? RenewAt { get; set; }        // Bir sonraki yenileme (CurrentPeriodEnd ile aynı tutulur)
        public RenewalPolicy RenewalPolicy { get; set; } = RenewalPolicy.Auto;

        public int RenewalAttemptCount { get; set; } = 0;
        public DateTime? LastInvoicedAt { get; set; }
        public Guid? LastInvoiceId { get; set; }

        public string? CancellationReason { get; set; }
        public string? ExternalPaymentRef { get; set; } // Ödeme sağlayıcı ref (opsiyonel)
    }
}
