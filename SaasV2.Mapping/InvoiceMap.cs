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
    public class InvoiceMap : BaseMap<Invoice>
    {
        public override void Configure(EntityTypeBuilder<Invoice> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.PeriodStart).IsRequired();
            b.Property(x => x.PeriodEnd).IsRequired();

            b.Property(x => x.Currency).IsRequired();
            b.Property(x => x.Subtotal).HasColumnType("decimal(18,4)");
            b.Property(x => x.Tax).HasColumnType("decimal(18,4)");
            b.Property(x => x.Total).HasColumnType("decimal(18,4)");
            b.Property(x => x.PaymentStatus).HasConversion<int>().IsRequired();
            b.Property(x => x.PaymentProvider).HasMaxLength(64);
            b.Property(x => x.PaymentReference).HasMaxLength(128);
            b.Property(x => x.RequiresAction).HasDefaultValue(false);
            b.Property(x => x.PaymentAttemptCount).HasDefaultValue(0);
            b.Property(x => x.LastErrorCode).HasMaxLength(64);
            b.Property(x => x.LastErrorMessage).HasMaxLength(1024);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasOne<AppUser>()
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.UserId, x.PeriodStart, x.PeriodEnd });
            b.HasIndex(x => x.Total);
        }
    }
}
