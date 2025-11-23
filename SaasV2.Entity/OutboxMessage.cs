using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Outbox (güvenilir gönderim için)
    public class OutboxMessage : BaseEntity
    {
        public Guid? AppId { get; set; }
        public string Type { get; set; }          // Event tipi
        public string Payload { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public int Retries { get; set; }
    }
}
