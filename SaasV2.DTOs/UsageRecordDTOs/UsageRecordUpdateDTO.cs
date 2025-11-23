using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.UsageRecordDTOs
{
    public class UsageRecordUpdateDTO
    {
        public Guid Id { get; set; }
        public decimal Quantity { get; set; }
        public DateTime OccurredAt { get; set; }
        public string MetadataJson { get; set; }
    }
}
