using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Webhook uçları
    public class WebhookEndpoint : BaseEntity
    {
        public Guid AppId { get; set; }
        public string Url { get; set; }
        public string Secret { get; set; }
        public bool IsActive { get; set; } = true;
        public string EventTypesCsv { get; set; } // Hangi event’leri ister
    }
}
