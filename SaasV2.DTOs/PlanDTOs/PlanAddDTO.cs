using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.PlanDTOs
{
    public class PlanAddDTO
    {
        public Guid AppId { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; } = true;
        public bool IsFree { get; set; } = false;
        public int TrialDays { get; set; } = 0;
        public BillingPeriod BillingPeriod { get; set; } = BillingPeriod.Monthly;
        public RenewalPolicy RenewalPolicy { get; set; } = RenewalPolicy.Auto;
    }

}
