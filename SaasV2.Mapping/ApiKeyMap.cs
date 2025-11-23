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
    public class ApiKeyMap : BaseMap<ApiKey>
    {
        public override void Configure(EntityTypeBuilder<ApiKey> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.Name).IsRequired().HasMaxLength(100);
            b.Property(x => x.Prefix).IsRequired().HasMaxLength(16);
            b.Property(x => x.Hash).IsRequired().HasMaxLength(128);
            b.Property(x => x.Scopes).HasMaxLength(1000);
            b.Property(x => x.ExpiresAt);
            b.Property(x => x.LastUsedAt);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.Prefix).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.Hash).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.ExpiresAt);
            b.HasIndex(x => x.LastUsedAt);
        }
    }
}
