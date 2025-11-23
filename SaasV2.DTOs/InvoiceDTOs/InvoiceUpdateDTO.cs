using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoiceUpdateDTO
    {
        public Guid Id { get; set; }
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
        public Status Status { get; set; }
    }
}
