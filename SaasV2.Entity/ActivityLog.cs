using System;

namespace SaasV2.Entity
{
    /// <summary>
    /// Sistem aktivite logları - kim ne yaptı, ne zaman yaptı
    /// </summary>
    public class ActivityLog : BaseEntity
    {
        public Guid? UserId { get; set; }           // Kim yaptı (nullable - sistem işlemleri için)
        public Guid? AppId { get; set; }            // Hangi uygulama için (nullable)
        
        public string Action { get; set; }           // Create, Update, Delete, Cancel, Activate, etc.
        public string EntityType { get; set; }       // Subscription, Invoice, Plan, App, User, etc.
        public Guid? EntityId { get; set; }         // Hangi kayıt (nullable)
        
        public string Description { get; set; }      // İnsan okunabilir açıklama
        public string? OldValues { get; set; }       // Eski değerler (JSON, nullable)
        public string? NewValues { get; set; }       // Yeni değerler (JSON, nullable)
        
        public string? IpAddress { get; set; }       // IP adresi (nullable)
        public string? UserAgent { get; set; }       // User agent (nullable)
        public string? RequestId { get; set; }       // Request correlation ID (nullable)
    }
}

