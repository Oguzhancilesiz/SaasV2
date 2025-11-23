using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.PlanDTOs
{
    public class PlanUpdateDTO
    {
        public Guid Id { get; set; }
        public Guid AppId { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }
        public bool IsFree { get; set; }
        public int TrialDays { get; set; }
        public BillingPeriod BillingPeriod { get; set; }
        public RenewalPolicy RenewalPolicy { get; set; }
    }
}
