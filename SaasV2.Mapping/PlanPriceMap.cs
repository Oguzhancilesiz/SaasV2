using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Mapping
{
    public class PlanPriceMap : BaseMap<PlanPrice>
    {
        public override void Configure(EntityTypeBuilder<PlanPrice> b)
        {
            base.Configure(b);

            b.Property(x => x.PlanId).IsRequired();
            b.Property(x => x.Currency).IsRequired();
            b.Property(x => x.Amount).IsRequired().HasColumnType("decimal(18,4)");
            b.Property(x => x.EffectiveFrom).IsRequired();
            b.Property(x => x.EffectiveTo);
            b.Property(x => x.IsCurrent).IsRequired();

            b.HasOne<Plan>()
             .WithMany()
             .HasForeignKey(x => x.PlanId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.PlanId, x.IsCurrent });
            b.HasIndex(x => new { x.PlanId, x.EffectiveFrom, x.EffectiveTo });
        }
    }
}
