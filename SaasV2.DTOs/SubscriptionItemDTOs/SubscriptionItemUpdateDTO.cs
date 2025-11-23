using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.SubscriptionItemDTOs
{
    public class SubscriptionItemUpdateDTO
    {
        public Guid Id { get; set; }
        public decimal? Allotted { get; set; }
        public decimal Used { get; set; }
        public DateTime? ResetsAt { get; set; }
    }
}
