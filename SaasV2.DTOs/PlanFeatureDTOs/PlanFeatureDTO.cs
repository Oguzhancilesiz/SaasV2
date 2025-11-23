using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.PlanFeatureDTOs
{
    public class PlanFeatureDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid PlanId { get; set; }
        public Guid FeatureId { get; set; }
        public decimal? Limit { get; set; }
        public ResetInterval ResetInterval { get; set; }
        public bool AllowOverage { get; set; }
        public decimal? OverusePrice { get; set; }
    }
}
