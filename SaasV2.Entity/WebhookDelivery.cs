using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Webhook teslim günlükleri
    public class WebhookDelivery : BaseEntity
    {
        public Guid WebhookEndpointId { get; set; }
        public string EventType { get; set; }
        public string Payload { get; set; }

        public DateTime AttemptedAt { get; set; }
        public int ResponseStatus { get; set; }
        public string ResponseBody { get; set; }
        public int Retries { get; set; }
    }
}
