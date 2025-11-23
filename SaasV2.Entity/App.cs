using SaasV2.Core.Enums;

namespace SaasV2.Entity
{
    // Uygulama (mobil/oyun) kaydı
    public class App : BaseEntity
    {
        public string Name { get; set; }          // Gösterim adı
        public string Code { get; set; }          // Kısa benzersiz kod/slug
        public string Description { get; set; }
        public Guid? OwnerUserId { get; set; }    // İsteğe bağlı: sahibi
        public AppEnvironment Environment { get; set; } = AppEnvironment.Production;
        public string? WorkspaceKey { get; set; }
        public string? OwnerContactEmail { get; set; }
        public string? BillingContactEmail { get; set; }
        public string? Notes { get; set; }
    }
}
