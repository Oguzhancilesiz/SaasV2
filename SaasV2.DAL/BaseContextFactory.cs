using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace SaasV2.DAL
{
    public class BaseContextFactory : IDesignTimeDbContextFactory<BaseContext>
    {
        public BaseContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<BaseContext>();
            optionsBuilder.UseSqlServer("Server=localhost;Database=SaasV2;Trusted_Connection=True;TrustServerCertificate=True;");

            return new BaseContext(optionsBuilder.Options, null);
        }
    }
}

