using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.OutboxDTOs
{
    public class OutboxMessageUpdateDTO
    {
        public Guid Id { get; set; }
        public DateTime? ProcessedAt { get; set; }
        public int Retries { get; set; }
        public Status Status { get; set; }
    }
}
