// Feature.cs
using System;

namespace SaasV2.Entity
{
    // Uygulamalarda ortak/özel kullanılabilecek özellik tanımı
    public class Feature : BaseEntity
    {
        public Guid AppId { get; set; }          // App-scoped
        public string Key { get; set; }          // Örn: "api.requests", "storage.gb"
        public string Name { get; set; }         // İnsan-dostu ad
        public string Unit { get; set; }         // Örn: "request", "GB", "seat"
        public string Description { get; set; }
    }
}
