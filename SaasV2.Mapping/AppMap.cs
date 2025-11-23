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
    public class AppMap : BaseMap<App>
    {
        public override void Configure(EntityTypeBuilder<App> b)
        {
            base.Configure(b);

            b.Property(x => x.Name).IsRequired().HasMaxLength(200);
            b.Property(x => x.Code).IsRequired().HasMaxLength(64);
            b.Property(x => x.Description).HasMaxLength(1000);
            b.Property(x => x.Environment)
             .HasConversion<int>()
             .HasDefaultValue(AppEnvironment.Production);
            b.Property(x => x.WorkspaceKey).HasMaxLength(64);
            b.Property(x => x.OwnerContactEmail).HasMaxLength(256);
            b.Property(x => x.BillingContactEmail).HasMaxLength(256);
            b.Property(x => x.Notes).HasColumnType("nvarchar(max)");

            b.HasIndex(x => x.Code).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.WorkspaceKey).IsUnique()
             .HasFilter($"[WorkspaceKey] IS NOT NULL AND [Status] <> {(int)Status.Deleted}");

            // OwnerUserId opsiyonel
            b.HasIndex(x => x.OwnerUserId);
            b.HasOne<AppUser>()        // navigation yok, shadow
             .WithMany()
             .HasForeignKey(x => x.OwnerUserId)
             .OnDelete(DeleteBehavior.NoAction);
        }
    }
}
