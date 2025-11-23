using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Core.Enums;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class FeatureMap : BaseMap<Feature>
    {
        public override void Configure(EntityTypeBuilder<Feature> b)
        {
            base.Configure(b);

            b.ToTable("Feature");

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.Key).IsRequired().HasMaxLength(128);
            b.Property(x => x.Name).IsRequired().HasMaxLength(150);
            b.Property(x => x.Unit).HasMaxLength(32);
            b.Property(x => x.Description).HasMaxLength(1000);

            // App-scoped benzersizlik
            b.HasIndex(x => new { x.AppId, x.Key })
             .IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.AppId);
        }
    }
}
