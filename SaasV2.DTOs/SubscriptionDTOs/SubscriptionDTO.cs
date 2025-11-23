using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.SubscriptionDTOs
{
    public class SubscriptionDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public Guid PlanId { get; set; }
        public Guid? PlanPriceId { get; set; }
        public CurrencyCode Currency { get; set; }
        public decimal UnitPrice { get; set; }

        public DateTime StartAt { get; set; }
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? RenewAt { get; set; }
        public RenewalPolicy RenewalPolicy { get; set; }
        public int RenewalAttemptCount { get; set; }
        public DateTime? LastInvoicedAt { get; set; }
        public Guid? LastInvoiceId { get; set; }
        public string? CancellationReason { get; set; }
        public string ExternalPaymentRef { get; set; }
    }
}
