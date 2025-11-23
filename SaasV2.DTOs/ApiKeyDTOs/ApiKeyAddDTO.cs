using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.ApiKeyDTOs
{
    public class ApiKeyAddDTO
    {
        public Guid AppId { get; set; }
        public string Name { get; set; }
        public string Prefix { get; set; }   // İsteğe bağlı: genelde server üretir
        public string Hash { get; set; }     // İsteğe bağlı: genelde server üretir
        public string Scopes { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
