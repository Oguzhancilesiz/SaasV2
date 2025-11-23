using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.RoleDTOs
{
    public class RoleDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public Status Status { get; set; }
        public DateTime CratedDate { get; set; }
    }
}
