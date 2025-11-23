using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class AppSettingMap : BaseMap<AppSetting>
    {
        public override void Configure(EntityTypeBuilder<AppSetting> b)
        {
            base.Configure(b);

            b.Property(x => x.Key).IsRequired().HasMaxLength(200);
            b.Property(x => x.Value).IsRequired().HasMaxLength(2000);
            b.Property(x => x.Description).HasMaxLength(500);
            b.Property(x => x.Category).IsRequired().HasMaxLength(50);

            b.HasIndex(x => x.Key).IsUnique();
            b.HasIndex(x => x.Category);
        }
    }
}








