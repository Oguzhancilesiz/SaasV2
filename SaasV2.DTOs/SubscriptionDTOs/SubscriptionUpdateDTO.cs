using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.SubscriptionDTOs
{
    public class SubscriptionUpdateDTO
    {
        public Guid Id { get; set; }
        public Guid PlanId { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? RenewAt { get; set; }
        public RenewalPolicy RenewalPolicy { get; set; }
        public string ExternalPaymentRef { get; set; }
        public Status Status { get; set; } // İptal/aktif güncelleme senaryosu için
        public string? CancellationReason { get; set; }
    }
}
