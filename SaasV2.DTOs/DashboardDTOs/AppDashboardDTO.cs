using System;
using System.Collections.Generic;

namespace SaasV2.DTOs.DashboardDTOs
{
    public class AppPlanDetailDTO
    {
        public Guid PlanId { get; set; }
        public string PlanName { get; set; }
        public string PlanCode { get; set; }
        public bool IsFree { get; set; }
        public int BillingPeriod { get; set; }
        public int? TrialDays { get; set; }
        public decimal? CurrentPrice { get; set; }
        public string? CurrentPriceCurrency { get; set; }
        public int SubscriptionsCount { get; set; }
        public int ActiveSubscriptionsCount { get; set; }
    }

    public class AppSubscriptionDetailDTO
    {
        public Guid SubscriptionId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public Guid PlanId { get; set; }
        public string PlanName { get; set; }
        public DateTime StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public bool IsActive { get; set; }
        public decimal? PlanPrice { get; set; }
        public string? PlanPriceCurrency { get; set; }
    }

    public class AppFeatureDetailDTO
    {
        public Guid FeatureId { get; set; }
        public string FeatureKey { get; set; }
        public string FeatureName { get; set; }
        public string FeatureUnit { get; set; }
        public string Description { get; set; }
    }

    public class AppApiKeyDetailDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Prefix { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime CreatedDate { get; set; }
        public bool IsActive { get; set; }
    }

    public class AppWebhookDetailDTO
    {
        public Guid Id { get; set; }
        public string Url { get; set; }
        public bool IsActive { get; set; }
        public string EventTypesCsv { get; set; }
        public DateTime? LastDeliveryAt { get; set; }
        public string? LastDeliveryStatus { get; set; }
    }

    public class AppUserRegistrationDetailDTO
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; }
        public string UserEmail { get; set; }
        public DateTime RegisteredAt { get; set; }
        public bool HasActiveSubscription { get; set; }
    }

    public class AppDashboardDTO
    {
        public Guid AppId { get; set; }
        public string AppName { get; set; }
        public string AppCode { get; set; }
        public string Description { get; set; }
        public int Status { get; set; }
        public Guid? OwnerUserId { get; set; }
        public string? OwnerUserName { get; set; }

        // İstatistikler
        public int TotalPlans { get; set; }
        public int ActivePlans { get; set; }
        public int TotalSubscriptions { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int TotalUsersRegistered { get; set; }
        public int TotalApiKeys { get; set; }
        public int ActiveApiKeys { get; set; }
        public int TotalWebhookEndpoints { get; set; }
        public int ActiveWebhookEndpoints { get; set; }

        // Finansal
        public decimal? TotalRevenue { get; set; }
        public string? TotalRevenueCurrency { get; set; }
        public decimal? RevenueLast30Days { get; set; }
        public string? RevenueLast30DaysCurrency { get; set; }
        public decimal? RevenueLast7Days { get; set; }
        public string? RevenueLast7DaysCurrency { get; set; }

        // Detaylar
        public List<AppPlanDetailDTO> Plans { get; set; } = new();
        public List<AppSubscriptionDetailDTO> Subscriptions { get; set; } = new();
        public List<AppFeatureDetailDTO> Features { get; set; } = new();
        public List<AppApiKeyDetailDTO> ApiKeys { get; set; } = new();
        public List<AppWebhookDetailDTO> WebhookEndpoints { get; set; } = new();
        public List<AppUserRegistrationDetailDTO> UserRegistrations { get; set; } = new();

        // Son Aktiviteler
        public DateTime? LastSubscriptionCreated { get; set; }
        public DateTime? LastUserRegistered { get; set; }
        public DateTime? LastInvoiceCreated { get; set; }
        public DateTime? LastFeatureCreated { get; set; }
    }
}

