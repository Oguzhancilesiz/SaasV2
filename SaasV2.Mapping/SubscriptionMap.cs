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
    public class SubscriptionMap : BaseMap<Subscription>
    {
        public override void Configure(EntityTypeBuilder<Subscription> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.UserId).IsRequired();
            b.Property(x => x.PlanId).IsRequired();
            b.Property(x => x.PlanPriceId);
            b.Property(x => x.Currency).HasConversion<int>().IsRequired();
            b.Property(x => x.UnitPrice).HasColumnType("decimal(18,4)");
            b.Property(x => x.StartAt).IsRequired();
            b.Property(x => x.CurrentPeriodStart).IsRequired();
            b.Property(x => x.CurrentPeriodEnd).IsRequired();
            b.Property(x => x.TrialEndsAt);
            b.Property(x => x.EndAt);
            b.Property(x => x.RenewAt);
            b.Property(x => x.RenewalPolicy).IsRequired();
            b.Property(x => x.RenewalAttemptCount).HasDefaultValue(0);
            b.Property(x => x.LastInvoicedAt);
            b.Property(x => x.LastInvoiceId);
            b.Property(x => x.CancellationReason).HasMaxLength(512);
            b.Property(x => x.ExternalPaymentRef).HasMaxLength(128);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<AppUser>()
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<Plan>()
             .WithMany()
             .HasForeignKey(x => x.PlanId)
             .OnDelete(DeleteBehavior.NoAction);

            b.HasIndex(x => new { x.AppId, x.UserId, x.Status });
            b.HasIndex(x => x.RenewAt);
            b.HasIndex(x => x.EndAt);

            // İstersen servis tarafında “aynı App’te tek aktif abonelik” kuralı
            // DB tarafında partial unique istersen migration’da el ile:
            // CREATE UNIQUE INDEX UX_Subscription_App_User_Active ON Subscriptions(AppId,UserId) WHERE Status = 1;
        }
    }
}
