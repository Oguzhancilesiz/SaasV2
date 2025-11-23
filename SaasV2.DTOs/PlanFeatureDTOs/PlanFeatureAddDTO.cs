using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.PlanFeatureDTOs
{
    public class PlanFeatureAddDTO
    {
        public Guid PlanId { get; set; }
        public Guid FeatureId { get; set; }
        public decimal? Limit { get; set; }
        public ResetInterval ResetInterval { get; set; }
        public bool AllowOverage { get; set; } = false;
        public decimal? OverusePrice { get; set; }
    }
}
