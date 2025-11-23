using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Core.Enums;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class ActivityLogMap : BaseMap<ActivityLog>
    {
        public override void Configure(EntityTypeBuilder<ActivityLog> b)
        {
            base.Configure(b);

            b.Property(x => x.Action).IsRequired().HasMaxLength(100);
            b.Property(x => x.EntityType).IsRequired().HasMaxLength(100);
            b.Property(x => x.Description).IsRequired().HasMaxLength(1000);
            b.Property(x => x.OldValues).IsRequired(false).HasColumnType("nvarchar(max)"); // JSON için, nullable
            b.Property(x => x.NewValues).IsRequired(false).HasColumnType("nvarchar(max)"); // JSON için, nullable
            b.Property(x => x.IpAddress).IsRequired(false).HasMaxLength(50);
            b.Property(x => x.UserAgent).IsRequired(false).HasMaxLength(500);
            b.Property(x => x.RequestId).IsRequired(false).HasMaxLength(100);

            // Indexler
            b.HasIndex(x => x.UserId);
            b.HasIndex(x => x.AppId);
            b.HasIndex(x => x.EntityType);
            b.HasIndex(x => x.EntityId);
            b.HasIndex(x => x.CreatedDate);
            b.HasIndex(x => new { x.EntityType, x.EntityId }); // Composite index

            // Foreign keys (opsiyonel)
            b.HasOne<AppUser>()
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.NoAction);
        }
    }
}

