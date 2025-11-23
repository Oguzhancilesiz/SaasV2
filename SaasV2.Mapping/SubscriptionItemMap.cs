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
    public class SubscriptionItemMap : BaseMap<SubscriptionItem>
    {
        public override void Configure(EntityTypeBuilder<SubscriptionItem> b)
        {
            base.Configure(b);

            b.Property(x => x.SubscriptionId).IsRequired();
            b.Property(x => x.FeatureId).IsRequired();
            b.Property(x => x.Allotted).HasColumnType("decimal(18,4)");
            b.Property(x => x.Used).IsRequired().HasColumnType("decimal(18,4)");
            b.Property(x => x.ResetsAt);

            b.HasOne<Subscription>()
             .WithMany()
             .HasForeignKey(x => x.SubscriptionId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<Feature>()
             .WithMany()
             .HasForeignKey(x => x.FeatureId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.SubscriptionId, x.FeatureId }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.ResetsAt);
        }
    }
}
