using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class SubscriptionChangeLogMap : BaseMap<SubscriptionChangeLog>
    {
        public override void Configure(EntityTypeBuilder<SubscriptionChangeLog> builder)
        {
            base.Configure(builder);

            builder.Property(x => x.SubscriptionId).IsRequired();
            builder.Property(x => x.AppId).IsRequired();
            builder.Property(x => x.UserId).IsRequired();
            builder.Property(x => x.ChangeType).IsRequired();
            builder.Property(x => x.EffectiveDate).IsRequired();

            builder.Property(x => x.Reason).HasMaxLength(512);
            builder.Property(x => x.Metadata).HasColumnType("nvarchar(max)");
            builder.Property(x => x.OldAmount).HasColumnType("decimal(18,4)");
            builder.Property(x => x.NewAmount).HasColumnType("decimal(18,4)");

            builder.HasOne<Subscription>()
                   .WithMany()
                   .HasForeignKey(x => x.SubscriptionId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<App>()
                   .WithMany()
                   .HasForeignKey(x => x.AppId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<AppUser>()
                   .WithMany()
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne<Invoice>()
                   .WithMany()
                   .HasForeignKey(x => x.InvoiceId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(x => new { x.SubscriptionId, x.EffectiveDate });
            builder.HasIndex(x => new { x.AppId, x.ChangeType });
        }
    }
}

