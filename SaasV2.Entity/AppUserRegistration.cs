using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    // Kullanıcının belirli bir App'e kaydı
    public class AppUserRegistration : BaseEntity
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }          // AppUser.Id
        public DateTime RegisteredAt { get; set; }
        public string Provider { get; set; }      // e-posta, apple, google vs. (opsiyonel)
        public string ExternalId { get; set; }    // dış sağlayıcı kimliği (opsiyonel)
    }
}
