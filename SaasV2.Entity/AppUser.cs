using Microsoft.AspNetCore.Identity;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Entity
{
    public class AppUser : IdentityUser<Guid>, IEntity
    {
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }
    }
}
