using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SaasV2.Entity;

namespace SaasV2.Mapping
{
    public class EmailVerificationCodeMap : BaseMap<EmailVerificationCode>
    {
        public override void Configure(EntityTypeBuilder<EmailVerificationCode> b)
        {
            base.Configure(b);

            b.Property(x => x.Email).IsRequired().HasMaxLength(256);
            b.Property(x => x.Code).IsRequired().HasMaxLength(10);
            b.Property(x => x.ExpiresAt).IsRequired().HasColumnType("datetime2");
            b.Property(x => x.IsUsed).IsRequired();
            b.Property(x => x.UsedAt).IsRequired(false).HasColumnType("datetime2");
            b.Property(x => x.UserName).IsRequired(false).HasMaxLength(256);
            b.Property(x => x.PasswordHash).IsRequired(false).HasMaxLength(500);

            // Indexler
            b.HasIndex(x => x.Email);
            b.HasIndex(x => x.Code);
            b.HasIndex(x => new { x.Email, x.Code, x.IsUsed });
            b.HasIndex(x => x.ExpiresAt);
        }
    }
}

