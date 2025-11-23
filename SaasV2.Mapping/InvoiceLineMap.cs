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
    public class InvoiceLineMap : BaseMap<InvoiceLine>
    {
        public override void Configure(EntityTypeBuilder<InvoiceLine> b)
        {
            base.Configure(b);

            b.Property(x => x.InvoiceId).IsRequired();
            b.Property(x => x.Description).IsRequired().HasMaxLength(300);
            b.Property(x => x.PlanId);
            b.Property(x => x.FeatureId);
            b.Property(x => x.Quantity).IsRequired().HasColumnType("decimal(18,4)");
            b.Property(x => x.UnitPrice).IsRequired().HasColumnType("decimal(18,4)");
            b.Property(x => x.Amount).IsRequired().HasColumnType("decimal(18,4)");

            b.HasOne<Invoice>()
             .WithMany()
             .HasForeignKey(x => x.InvoiceId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<Plan>()
             .WithMany()
             .HasForeignKey(x => x.PlanId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne<Feature>()
             .WithMany()
             .HasForeignKey(x => x.FeatureId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => x.InvoiceId);
        }
    }
}
