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
    public class WebhookEndpointMap : BaseMap<WebhookEndpoint>
    {
        public override void Configure(EntityTypeBuilder<WebhookEndpoint> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.Url).IsRequired().HasMaxLength(500);
            b.Property(x => x.Secret).IsRequired().HasMaxLength(128);
            b.Property(x => x.IsActive).IsRequired();
            b.Property(x => x.EventTypesCsv).HasMaxLength(1000);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.AppId, x.Url }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.IsActive);
        }
    }
}
