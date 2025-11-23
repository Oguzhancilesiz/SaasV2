using System;
using System.Collections.Generic;

namespace SaasV2.DTOs.DashboardDTOs
{
    public class UserSubscriptionDetailDTO
    {
        public Guid SubscriptionId { get; set; }
        public Guid AppId { get; set; }
        public string AppName { get; set; }
        public string AppCode { get; set; }
        public Guid PlanId { get; set; }
        public string PlanName { get; set; }
        public string PlanCode { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? RenewAt { get; set; }
        public bool IsActive { get; set; }
        public string BillingPeriod { get; set; }            // Monthly, Yearly, etc.
        public decimal? PlanPrice { get; set; }
        public string? PlanPriceCurrency { get; set; }
        public int? TrialDays { get; set; }
        public bool IsFreePlan { get; set; }
    }

    public class UserAppRegistrationDTO
    {
        public Guid AppId { get; set; }
        public string AppName { get; set; }
        public string AppCode { get; set; }
        public DateTime RegisteredAt { get; set; }
        public bool HasActiveSubscription { get; set; }
    }

    public class UserDashboardDTO
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public string? Phone { get; set; }
        public int Status { get; set; }

        // Abonelik İstatistikleri
        public int TotalSubscriptions { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int CancelledSubscriptions { get; set; }

        // Uygulama İstatistikleri
        public int TotalAppsRegistered { get; set; }
        public int AppsWithActiveSubscription { get; set; }

        // Toplam Harcama (tüm zamanlar)
        public decimal? TotalSpent { get; set; }
        public string? TotalSpentCurrency { get; set; }

        // Son 30 gün harcama
        public decimal? SpentLast30Days { get; set; }
        public string? SpentLast30DaysCurrency { get; set; }

        // Abonelik Detayları
        public List<UserSubscriptionDetailDTO> Subscriptions { get; set; } = new();

        // Uygulama Kayıtları
        public List<UserAppRegistrationDTO> AppRegistrations { get; set; } = new();

        // Son Aktiviteler
        public DateTime? LastSubscriptionCreated { get; set; }
        public DateTime? LastSubscriptionCancelled { get; set; }
        public DateTime? LastAppRegistered { get; set; }
    }
}
