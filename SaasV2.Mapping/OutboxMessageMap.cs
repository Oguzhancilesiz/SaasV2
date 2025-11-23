using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Mapping
{
    public class OutboxMessageMap : BaseMap<OutboxMessage>
    {
        public override void Configure(EntityTypeBuilder<OutboxMessage> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId);
            b.Property(x => x.Type).IsRequired().HasMaxLength(128);
            b.Property(x => x.Payload).IsRequired();
            b.Property(x => x.OccurredAt).IsRequired();
            b.Property(x => x.ProcessedAt);
            b.Property(x => x.Retries).IsRequired();

            b.HasIndex(x => x.OccurredAt);
            b.HasIndex(x => new { x.ProcessedAt, x.Retries });
            b.HasIndex(x => x.Type);
        }
    }
}
