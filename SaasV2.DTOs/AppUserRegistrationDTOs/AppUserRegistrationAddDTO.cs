using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.AppUserRegistrationDTOs
{
    public class AppUserRegistrationAddDTO
    {
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public DateTime RegisteredAt { get; set; }
        public string Provider { get; set; }
        public string ExternalId { get; set; }
    }
}
