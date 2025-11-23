using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.UsageRecordDTOs
{
    public class UsageRecordAddDTO
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public Guid FeatureId { get; set; }
        public Guid? SubscriptionId { get; set; }
        public decimal Quantity { get; set; }
        public DateTime OccurredAt { get; set; }
        public string CorrelationId { get; set; }
        public string MetadataJson { get; set; }
    }
}
