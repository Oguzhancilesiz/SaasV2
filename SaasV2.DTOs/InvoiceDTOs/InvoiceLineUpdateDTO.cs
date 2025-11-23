using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoiceLineUpdateDTO
    {
        public Guid Id { get; set; }
        public string Description { get; set; }
        public Guid? PlanId { get; set; }
        public Guid? FeatureId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
    }
}
