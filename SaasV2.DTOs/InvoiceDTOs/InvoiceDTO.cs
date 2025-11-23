using SaasV2.Core.Enums;

namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoiceDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public CurrencyCode Currency { get; set; }
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        public string? PaymentProvider { get; set; }
        public string? PaymentReference { get; set; }
        public DateTime? DueDate { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? FailedAt { get; set; }
        public bool RequiresAction { get; set; }
        public DateTime? NextRetryAt { get; set; }
        public int PaymentAttemptCount { get; set; }
        public DateTime? LastAttemptAt { get; set; }
        public string? LastErrorCode { get; set; }
        public string? LastErrorMessage { get; set; }
    }
}
