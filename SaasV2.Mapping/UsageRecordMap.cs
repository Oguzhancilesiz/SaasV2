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
    public class UsageRecordMap : BaseMap<UsageRecord>
    {
        public override void Configure(EntityTypeBuilder<UsageRecord> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.FeatureId).IsRequired();
            b.Property(x => x.SubscriptionId);
            b.Property(x => x.Quantity).IsRequired().HasColumnType("decimal(18,4)");
            b.Property(x => x.OccurredAt).IsRequired();
            b.Property(x => x.CorrelationId).IsRequired().HasMaxLength(64);
            b.Property(x => x.MetadataJson).HasColumnType("nvarchar(max)");

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<AppUser>()
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne<Feature>()
             .WithMany()
             .HasForeignKey(x => x.FeatureId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne<Subscription>()
             .WithMany()
             .HasForeignKey(x => x.SubscriptionId)
             .OnDelete(DeleteBehavior.SetNull);

            b.HasIndex(x => new { x.AppId, x.UserId, x.CorrelationId }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.OccurredAt);
        }
    }
}
