using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.WebhookDTOs
{
    public class WebhookEndpointUpdateDTO
    {
        public Guid Id { get; set; }
        public string Url { get; set; }
        public string Secret { get; set; }
        public bool IsActive { get; set; }
        public string EventTypesCsv { get; set; }
    }
}
