using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.PlanPriceDTOs
{
    public class PlanPriceAddDTO
    {
        public Guid PlanId { get; set; }
        public CurrencyCode Currency { get; set; } = CurrencyCode.TRY;
        public decimal Amount { get; set; }
        public DateTime EffectiveFrom { get; set; }
        public DateTime? EffectiveTo { get; set; }
        public bool IsCurrent { get; set; } = true;
    }
}
