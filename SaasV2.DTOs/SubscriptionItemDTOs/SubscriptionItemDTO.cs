using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.SubscriptionItemDTOs
{
    public class SubscriptionItemDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid SubscriptionId { get; set; }
        public Guid FeatureId { get; set; }
        public decimal? Allotted { get; set; }
        public decimal Used { get; set; }
        public DateTime? ResetsAt { get; set; }
    }
}
