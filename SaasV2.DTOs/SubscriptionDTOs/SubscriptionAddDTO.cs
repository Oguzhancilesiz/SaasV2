using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.SubscriptionDTOs
{
    public class SubscriptionAddDTO
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public Guid PlanId { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? RenewAt { get; set; }
        public RenewalPolicy RenewalPolicy { get; set; } = RenewalPolicy.Auto;
        public string ExternalPaymentRef { get; set; }
    }
}
