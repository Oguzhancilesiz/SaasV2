using SaasV2.Core.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.DTOs.AppDTOs
{
    public class AppDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public Guid? OwnerUserId { get; set; }
        public AppEnvironment Environment { get; set; }
        public string? WorkspaceKey { get; set; }
        public string? OwnerContactEmail { get; set; }
        public string? BillingContactEmail { get; set; }
        public string? Notes { get; set; }
    }
}
