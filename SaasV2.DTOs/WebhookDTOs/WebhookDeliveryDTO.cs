using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.WebhookDTOs
{
    public class WebhookDeliveryDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid WebhookEndpointId { get; set; }
        public string EventType { get; set; }
        public string Payload { get; set; }
        public DateTime AttemptedAt { get; set; }
        public int ResponseStatus { get; set; }
        public string ResponseBody { get; set; }
        public int Retries { get; set; }
    }
}
