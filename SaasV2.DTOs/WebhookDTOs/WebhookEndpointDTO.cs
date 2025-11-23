using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.WebhookDTOs
{
    public class WebhookEndpointDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid AppId { get; set; }
        public string Url { get; set; }
        public string Secret { get; set; }
        public bool IsActive { get; set; }
        public string EventTypesCsv { get; set; }
    }
}
