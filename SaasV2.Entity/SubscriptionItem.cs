using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Abonelik kapsamında izlenen her özellik için sayaç
    public class SubscriptionItem : BaseEntity
    {
        public Guid SubscriptionId { get; set; }
        public Guid FeatureId { get; set; }

        public decimal? Allotted { get; set; }     // O dönem için tahsis
        public decimal Used { get; set; }          // O dönem kullanılan
        public DateTime? ResetsAt { get; set; }    // Sayaç sıfırlanma zamanı
    }
}
