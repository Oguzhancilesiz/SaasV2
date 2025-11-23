using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.OutboxDTOs
{
    public class OutboxMessageDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid? AppId { get; set; }
        public string Type { get; set; }
        public string Payload { get; set; }
        public DateTime OccurredAt { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public int Retries { get; set; }
    }
}
