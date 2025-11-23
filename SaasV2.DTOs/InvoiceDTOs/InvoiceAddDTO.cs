using SaasV2.Core.Enums;

namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoiceAddDTO
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public CurrencyCode Currency { get; set; } = CurrencyCode.TRY;
        public decimal Subtotal { get; set; }
        public decimal Tax { get; set; }
        public decimal Total { get; set; }
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        public string? PaymentProvider { get; set; }
        public string? PaymentReference { get; set; }
        public DateTime? DueDate { get; set; }
        public bool RequiresAction { get; set; }
    }
}
