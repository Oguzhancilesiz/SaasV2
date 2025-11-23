using SaasV2.Core.Enums;

namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoicePaymentAttemptDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid InvoiceId { get; set; }
        public DateTime AttemptedAt { get; set; }
        public decimal Amount { get; set; }
        public CurrencyCode Currency { get; set; }
        public PaymentStatus ResultStatus { get; set; }
        public string? PaymentProvider { get; set; }
        public string? ProviderReference { get; set; }
        public string? ProviderResponseCode { get; set; }
        public string? ProviderResponseMessage { get; set; }
        public bool RequiresAction { get; set; }
    }
}

