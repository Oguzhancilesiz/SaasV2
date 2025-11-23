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
    public class AppUserRegistrationMap : BaseMap<AppUserRegistration>
    {
        public override void Configure(EntityTypeBuilder<AppUserRegistration> b)
        {
            base.Configure(b);

            b.Property(x => x.RegisteredAt).IsRequired();
            b.Property(x => x.Provider).HasMaxLength(64);
            b.Property(x => x.ExternalId).HasMaxLength(128);

            b.HasOne<App>()
             .WithMany()
             .HasForeignKey(x => x.AppId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasOne<AppUser>()
             .WithMany()
             .HasForeignKey(x => x.UserId)
             .OnDelete(DeleteBehavior.Cascade);

            b.HasIndex(x => new { x.AppId, x.UserId }).IsUnique()
             .HasFilter($"[Status] <> {(int)Status.Deleted}");

            b.HasIndex(x => x.RegisteredAt);
        }
    }
}
