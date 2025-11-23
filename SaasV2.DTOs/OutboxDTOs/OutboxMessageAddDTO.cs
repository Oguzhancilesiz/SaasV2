using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.OutboxDTOs
{
    public class OutboxMessageAddDTO
    {
        public Guid? AppId { get; set; }
        public string Type { get; set; }
        public string Payload { get; set; }
        public DateTime OccurredAt { get; set; }
    }
}
