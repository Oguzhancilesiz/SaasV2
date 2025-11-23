using System;
using System.Collections.Generic;

namespace SaasV2.DTOs.DashboardDTOs
{
    public class GlobalDashboardDTO
    {
        // Genel İstatistikler
        public int TotalApps { get; set; }
        public int ActiveApps { get; set; }
        public int TotalUsers { get; set; }
        public int ActiveUsers { get; set; }
        public int TotalSubscriptions { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int TotalPlans { get; set; }
        public int ActivePlans { get; set; }

        // Gelir İstatistikleri
        public decimal? TotalRevenue { get; set; }           // Tüm zamanlar
        public decimal? RevenueLast30Days { get; set; }      // Son 30 gün
        public decimal? RevenueLast7Days { get; set; }       // Son 7 gün
        public string? RevenueCurrency { get; set; }

        // MRR (Monthly Recurring Revenue)
        public decimal? MRR { get; set; }
        public string? MRRCurrency { get; set; }

        // ARR (Annual Recurring Revenue)
        public decimal? ARR { get; set; }
        public string? ARRCurrency { get; set; }

        // Abonelik İstatistikleri
        public int NewSubscriptionsLast30Days { get; set; }
        public int CancelledSubscriptionsLast30Days { get; set; }
        public decimal? ChurnRate { get; set; }              // İptal oranı (%)

        // Kullanıcı İstatistikleri
        public int NewUsersLast30Days { get; set; }
        public int NewUsersLast7Days { get; set; }

        // Plan İstatistikleri
        public int FreePlans { get; set; }
        public int PaidPlans { get; set; }

        // API Keys & Webhooks
        public int TotalApiKeys { get; set; }
        public int ActiveApiKeys { get; set; }
        public int TotalWebhookEndpoints { get; set; }
        public int ActiveWebhookEndpoints { get; set; }

        // Son Aktiviteler (opsiyonel - özet)
        public DateTime? LastSubscriptionCreated { get; set; }
        public DateTime? LastUserRegistered { get; set; }
        public DateTime? LastInvoiceCreated { get; set; }

        // Sorunlar ve Uyarılar
        public int FailedWebhookDeliveriesLast24h { get; set; }
        public int PendingOutboxMessages { get; set; }
        public int ExpiredApiKeys { get; set; }
        public int UnpaidInvoices { get; set; }
        public int ExpiringSubscriptions7d { get; set; }
    }
}
