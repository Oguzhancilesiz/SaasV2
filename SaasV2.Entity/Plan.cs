using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Plan: App'e özeldir. Her App’in kendi plan seti olabilir.
    public class Plan : BaseEntity
    {
        public Guid AppId { get; set; }
        public string Name { get; set; }          // Örn: Free, Pro, Team
        public string Code { get; set; }          // Benzersiz kısa kod
        public string Description { get; set; }

        public bool IsPublic { get; set; } = true;      // Listelemeye açık mı
        public bool IsFree { get; set; } = false;       // Ücretsiz plan mı
        public int TrialDays { get; set; } = 0;         // Deneme süresi (gün)
        public BillingPeriod BillingPeriod { get; set; } = BillingPeriod.Monthly;
        public RenewalPolicy RenewalPolicy { get; set; } = RenewalPolicy.Auto;
    }
}
