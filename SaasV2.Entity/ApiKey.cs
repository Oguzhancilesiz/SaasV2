using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // App tarafında entegrasyon için API anahtarı
    public class ApiKey : BaseEntity
    {
        public Guid AppId { get; set; }
        public string Name { get; set; }          // Örn: "Mobile iOS"
        public string Prefix { get; set; }        // Anahtar başı (gösterilebilir)
        public string Hash { get; set; }          // Gizli anahtarın hash’i
        public string Scopes { get; set; }        // Virgülle ayrılmış kapsamlar
        public DateTime? ExpiresAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
    }
}
