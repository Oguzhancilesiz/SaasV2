using SaasV2.Core.Enums;
using System;

namespace SaasV2.DTOs.ActivityLogDTOs
{
    public class ActivityLogDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid? UserId { get; set; }
        public string? UserName { get; set; }      // Join ile gelecek
        public string? UserEmail { get; set; }     // Join ile gelecek
        
        public Guid? AppId { get; set; }
        public string? AppName { get; set; }       // Join ile gelecek
        public string? AppCode { get; set; }       // Join ile gelecek
        
        public string Action { get; set; }         // Create, Update, Delete, etc.
        public string EntityType { get; set; }     // Subscription, Invoice, Plan, etc.
        public Guid? EntityId { get; set; }        // Hangi kayıt (nullable)
        
        public string Description { get; set; }
        public string? OldValues { get; set; }     // JSON, nullable
        public string? NewValues { get; set; }     // JSON, nullable
        
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? RequestId { get; set; }
    }
}

