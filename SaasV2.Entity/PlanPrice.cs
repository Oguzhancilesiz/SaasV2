using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Plan fiyatı (geçmişe dönük fiyat izlemi için tarih aralıklı)
    public class PlanPrice : BaseEntity
    {
        public Guid PlanId { get; set; }
        public CurrencyCode Currency { get; set; } = CurrencyCode.TRY;
        public decimal Amount { get; set; }            // Vergi hariç/ dahil, stratejine göre

        public DateTime EffectiveFrom { get; set; }    // yürürlük başlangıcı
        public DateTime? EffectiveTo { get; set; }     // null = halen geçerli
        public bool IsCurrent { get; set; }            // kolay filtre için
    }
}
