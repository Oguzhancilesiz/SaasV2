using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    public class InvoiceLine : BaseEntity
    {
        public Guid InvoiceId { get; set; }
        public string Description { get; set; }

        public Guid? PlanId { get; set; }
        public Guid? FeatureId { get; set; }

        public decimal Quantity { get; set; } = 1m;
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
    }
}
