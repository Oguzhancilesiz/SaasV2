using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.ApiKeyDTOs
{
    public class ApiKeyUpdateDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Scopes { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }
}
