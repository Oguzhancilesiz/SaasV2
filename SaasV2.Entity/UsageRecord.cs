using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Gerçekleşen kullanım kayıtları (idempotent izleme)
    public class UsageRecord : BaseEntity
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public Guid? SubscriptionId { get; set; }  // O anki abonelik
        public Guid FeatureId { get; set; }

        public decimal Quantity { get; set; }      // Örn: 1 istek, 0.5 GB vb.
        public DateTime OccurredAt { get; set; }   // Gerçekleşme zamanı
        public string CorrelationId { get; set; }  // Idempotent anahtar
        public string MetadataJson { get; set; }   // İsteğe bağlı detay
    }
}
