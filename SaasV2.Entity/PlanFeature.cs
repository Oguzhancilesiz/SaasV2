using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Plan-Feature eşlemesi ve limit/yenilenme kuralı
    public class PlanFeature : BaseEntity
    {
        public Guid PlanId { get; set; }
        public Guid FeatureId { get; set; }

        public decimal? Limit { get; set; }               // Null = sınırsız
        public ResetInterval ResetInterval { get; set; }  // Günlük/aylık/tek seferlik vb.
        public bool AllowOverage { get; set; } = false;   // Aşım ücretlendirilsin mi
        public decimal? OverusePrice { get; set; }        // Aşım birim fiyatı
    }
}
