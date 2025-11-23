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
    public class PlanMap : BaseMap<Plan>
    {
        public override void Configure(EntityTypeBuilder<Plan> b)
        {
            base.Configure(b);

            b.Property(x => x.AppId).IsRequired();
            b.Property(x => x.Name).IsRequired().HasMaxLength(150);
            b.Property(x => x.Code).IsRequired().HasMaxLength(64);
            b.Property(x => x.Description).HasMaxLength(1000);

            b.Property(x => x.IsPublic).IsRequired();
            b.Property(x => x.IsFree).IsRequired();
            b.Property(x => x.TrialDays).HasDefaultValue(0);
            b.Property(x => x.BillingPeriod).IsRequired();
            b.Property(x => x.RenewalPolicy).IsRequired();

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.AppId, x.Code }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => new { x.AppId, x.Name })
             .HasFilter($"[Status] <> {(int)Status.Deleted}");
        }
    }
}
