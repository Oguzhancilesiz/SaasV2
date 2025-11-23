using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Core.Enums;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Mapping
{
    public class PlanFeatureMap : BaseMap<PlanFeature>
    {
        public override void Configure(EntityTypeBuilder<PlanFeature> b)
        {
            base.Configure(b);

            b.Property(x => x.PlanId).IsRequired();
            b.Property(x => x.FeatureId).IsRequired();
            b.Property(x => x.Limit).HasColumnType("decimal(18,4)");
            b.Property(x => x.ResetInterval).IsRequired();
            b.Property(x => x.AllowOverage).IsRequired();
            b.Property(x => x.OverusePrice).HasColumnType("decimal(18,4)");

            b.HasOne<Plan>()
             .WithMany()
             .HasForeignKey(x => x.PlanId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<Feature>()
             .WithMany()
             .HasForeignKey(x => x.FeatureId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.PlanId, x.FeatureId }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.ResetInterval);
        }
    }
}
