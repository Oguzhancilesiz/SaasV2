using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class InvoicePaymentAttemptMap : BaseMap<InvoicePaymentAttempt>
    {
        public override void Configure(EntityTypeBuilder<InvoicePaymentAttempt> b)
        {
            base.Configure(b);

            b.Property(x => x.InvoiceId).IsRequired();
            b.Property(x => x.AttemptedAt).IsRequired();
            b.Property(x => x.Amount).HasColumnType("decimal(18,4)");
            b.Property(x => x.Currency).IsRequired();
            b.Property(x => x.ResultStatus).HasConversion<int>().IsRequired();
            b.Property(x => x.PaymentProvider).HasMaxLength(64);
            b.Property(x => x.ProviderReference).HasMaxLength(128);
            b.Property(x => x.ProviderResponseCode).HasMaxLength(64);
            b.Property(x => x.ProviderResponseMessage).HasMaxLength(1024);

            b.HasOne<Invoice>()
             .WithMany()
             .HasForeignKey(x => x.InvoiceId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.InvoiceId, x.AttemptedAt });
        }
    }
}

