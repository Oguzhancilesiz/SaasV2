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
    public class WebhookDeliveryMap : BaseMap<WebhookDelivery>
    {
        public override void Configure(EntityTypeBuilder<WebhookDelivery> b)
        {
            base.Configure(b);

            b.Property(x => x.WebhookEndpointId).IsRequired();
            b.Property(x => x.EventType).IsRequired().HasMaxLength(128);
            b.Property(x => x.Payload).IsRequired(); // nvarchar(max)
            b.Property(x => x.AttemptedAt).IsRequired();
            b.Property(x => x.ResponseStatus).IsRequired();
            b.Property(x => x.ResponseBody);
            b.Property(x => x.Retries).IsRequired();

            b.HasOne<WebhookEndpoint>()
             .WithMany()
             .HasForeignKey(x => x.WebhookEndpointId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => x.AttemptedAt);
            b.HasIndex(x => new { x.EventType, x.AttemptedAt });
        }
    }
}
