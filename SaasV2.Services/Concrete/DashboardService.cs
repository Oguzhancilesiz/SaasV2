using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.DashboardDTOs;
using SaasV2.Services.Abstracts;
using SaasV2.Entity;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class DashboardService : IDashboardService
    {
        private readonly IUnitOfWork _uow;

        public DashboardService(IUnitOfWork uow)
        {
            _uow = uow;
        }

        public async Task<GlobalDashboardDTO> GetGlobalDashboardAsync()
        {
            var now = DateTime.UtcNow;
            var since30 = now.AddDays(-30);
            var since7 = now.AddDays(-7);

            var appRepo = _uow.Repository<App>();
            var userRepo = _uow.Repository<AppUser>();
            var planRepo = _uow.Repository<Plan>();
            var subRepo = _uow.Repository<Subscription>();
            var invRepo = _uow.Repository<Invoice>();
            var invLineRepo = _uow.Repository<InvoiceLine>();
            var keyRepo = _uow.Repository<ApiKey>();
            var whRepo = _uow.Repository<WebhookEndpoint>();
            var regRepo = _uow.Repository<AppUserRegistration>();

            // APPS
            var appsQ = await appRepo.GetBy(a => a.Status != Status.Deleted);
            var totalApps = await appsQ.CountAsync();
            var activeApps = await appsQ.CountAsync(a => a.Status == Status.Active);

            // USERS
            var usersQ = await userRepo.GetBy(u => u.Status != Status.Deleted);
            var totalUsers = await usersQ.CountAsync();
            var activeUsers = await usersQ.CountAsync(u => u.Status == Status.Active);
            var newUsers30 = await usersQ.CountAsync(u => u.CreatedDate >= since30);
            var newUsers7 = await usersQ.CountAsync(u => u.CreatedDate >= since7);

            // PLANS
            var plansQ = await planRepo.GetBy(p => p.Status != Status.Deleted);
            var totalPlans = await plansQ.CountAsync();
            var activePlans = await plansQ.CountAsync(p => p.Status == Status.Active);
            var freePlans = await plansQ.CountAsync(p => p.IsFree);
            var paidPlans = totalPlans - freePlans;

            // SUBSCRIPTIONS
            var subsQ = await subRepo.GetBy(s => s.Status != Status.Deleted);
            var totalSubs = await subsQ.CountAsync();
            var activeSubs = await subsQ.CountAsync(s => s.Status == Status.Active && (s.EndAt == null || s.EndAt > now));
            var newSubs30 = await subsQ.CountAsync(s => s.CreatedDate >= since30);
            var cancelledSubs30 = await subsQ.CountAsync(s => s.Status == Status.Cancel && s.ModifiedDate >= since30);

            // REVENUE
            var allInvsQ = await invRepo.GetBy(i => i.Status != Status.Deleted);
            var allInvIds = await allInvsQ.Select(i => i.Id).ToListAsync();
            decimal? totalRevenue = null;
            string? revenueCur = null;

            if (allInvIds.Count > 0)
            {
                var allLines = await invLineRepo.GetBy(l => allInvIds.Contains(l.InvoiceId));
                var totalSum = await allLines.SumAsync(l => (decimal?)(l.Amount * l.Quantity));
                totalRevenue = totalSum ?? 0m;

                var firstInv = await allInvsQ.FirstOrDefaultAsync();
                revenueCur = firstInv?.Currency.ToString();
            }

            // REVENUE LAST 30 DAYS
            var inv30Q = await invRepo.GetBy(i => i.CreatedDate >= since30 && i.Status != Status.Deleted);
            var inv30Ids = await inv30Q.Select(i => i.Id).ToListAsync();
            decimal? revenue30 = null;

            if (inv30Ids.Count > 0)
            {
                var lines30 = await invLineRepo.GetBy(l => inv30Ids.Contains(l.InvoiceId));
                revenue30 = await lines30.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
            }

            // REVENUE LAST 7 DAYS
            var inv7Q = await invRepo.GetBy(i => i.CreatedDate >= since7 && i.Status != Status.Deleted);
            var inv7Ids = await inv7Q.Select(i => i.Id).ToListAsync();
            decimal? revenue7 = null;

            if (inv7Ids.Count > 0)
            {
                var lines7 = await invLineRepo.GetBy(l => inv7Ids.Contains(l.InvoiceId));
                revenue7 = await lines7.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
            }

            // MRR (Monthly Recurring Revenue) - Aktif aboneliklerin aylık toplamı
            var activeSubsList = await subsQ
                .Where(s => s.Status == Status.Active && (s.EndAt == null || s.EndAt > now))
                .ToListAsync();

            decimal? mrr = null;
            string? mrrCur = null;

            if (activeSubsList.Count > 0)
            {
                var planIds = activeSubsList.Select(s => s.PlanId).Distinct().ToList();
                var priceRepo = _uow.Repository<PlanPrice>();
                var prices = await priceRepo.GetBy(pp => 
                    planIds.Contains(pp.PlanId) && 
                    pp.IsCurrent && 
                    pp.Status == Status.Active &&
                    pp.EffectiveFrom <= now &&
                    (pp.EffectiveTo == null || pp.EffectiveTo >= now)
                );

                var pricesList = await prices.ToListAsync();
                var mrrCalc = 0m;

                foreach (var sub in activeSubsList)
                {
                    var planPrice = pricesList
                        .Where(p => p.PlanId == sub.PlanId)
                        .OrderByDescending(p => p.EffectiveFrom)
                        .FirstOrDefault();

                    if (planPrice != null)
                    {
                        // Billing period'a göre aylık değere çevir
                        var plan = await planRepo.GetById(sub.PlanId);
                        if (plan != null)
                        {
                            decimal monthlyAmount = planPrice.Amount;
                            if (plan.BillingPeriod == BillingPeriod.Yearly)
                                monthlyAmount = planPrice.Amount / 12m;
                            else if (plan.BillingPeriod == BillingPeriod.Weekly)
                                monthlyAmount = planPrice.Amount * 4.33m;
                            else if (plan.BillingPeriod == BillingPeriod.Daily)
                                monthlyAmount = planPrice.Amount * 30m;

                            mrrCalc += monthlyAmount;
                            if (mrrCur == null) mrrCur = planPrice.Currency.ToString();
                        }
                    }
                }

                mrr = mrrCalc > 0 ? mrrCalc : null;
            }

            // ARR (Annual Recurring Revenue) = MRR * 12
            decimal? arr = mrr.HasValue ? mrr.Value * 12m : null;

            // CHURN RATE
            decimal? churnRate = null;
            if (totalSubs > 0 && newSubs30 > 0)
            {
                churnRate = (cancelledSubs30 / (decimal)newSubs30) * 100m;
            }

            // API KEYS
            var keysQ = await keyRepo.GetBy(k => k.Status != Status.Deleted);
            var totalKeys = await keysQ.CountAsync();
            var activeKeys = await keysQ.CountAsync(k => k.Status == Status.Active);

            // WEBHOOKS
            var whQ = await whRepo.GetBy(w => w.Status != Status.Deleted);
            var totalWh = await whQ.CountAsync();
            var activeWh = await whQ.CountAsync(w => w.Status == Status.Active);

            // SORUNLAR VE UYARILAR
            var since24h = now.AddHours(-24);
            var whdRepo = _uow.Repository<WebhookDelivery>();
            var failedWhQ = await whdRepo.GetBy(d => 
                d.AttemptedAt >= since24h && 
                d.Status != Status.Deleted &&
                (d.ResponseStatus == 0 || d.ResponseStatus >= 500));
            var failedWhCount = await failedWhQ.CountAsync();

            var outboxRepo = _uow.Repository<OutboxMessage>();
            var pendingOutboxQ = await outboxRepo.GetBy(o => 
                o.ProcessedAt == null && 
                o.Status != Status.Deleted);
            var pendingOutboxCount = await pendingOutboxQ.CountAsync();

            var expiredKeysQ = await keyRepo.GetBy(k => 
                k.Status != Status.Deleted && 
                k.ExpiresAt.HasValue && 
                k.ExpiresAt.Value < now);
            var expiredKeysCount = await expiredKeysQ.CountAsync();

            var unpaidInvsQ = await invRepo.GetBy(i => 
                i.Status != Status.Deleted && 
                i.Status != Status.Commit);
            var unpaidInvsCount = await unpaidInvsQ.CountAsync();

            var expiring7d = now.AddDays(7);
            var expiringSubsQ = await subRepo.GetBy(s => 
                s.Status == Status.Active && 
                s.EndAt.HasValue && 
                s.EndAt.Value <= expiring7d && 
                s.EndAt.Value > now);
            var expiringSubsCount = await expiringSubsQ.CountAsync();

            // LAST ACTIVITIES
            var lastSub = await subsQ.OrderByDescending(s => s.CreatedDate).FirstOrDefaultAsync();
            var lastUser = await usersQ.OrderByDescending(u => u.CreatedDate).FirstOrDefaultAsync();
            var lastInv = await allInvsQ.OrderByDescending(i => i.CreatedDate).FirstOrDefaultAsync();

            return new GlobalDashboardDTO
            {
                TotalApps = totalApps,
                ActiveApps = activeApps,
                TotalUsers = totalUsers,
                ActiveUsers = activeUsers,
                TotalSubscriptions = totalSubs,
                ActiveSubscriptions = activeSubs,
                TotalPlans = totalPlans,
                ActivePlans = activePlans,
                TotalRevenue = totalRevenue,
                RevenueLast30Days = revenue30,
                RevenueLast7Days = revenue7,
                RevenueCurrency = revenueCur,
                MRR = mrr,
                MRRCurrency = mrrCur,
                ARR = arr,
                ARRCurrency = mrrCur,
                NewSubscriptionsLast30Days = newSubs30,
                CancelledSubscriptionsLast30Days = cancelledSubs30,
                ChurnRate = churnRate,
                NewUsersLast30Days = newUsers30,
                NewUsersLast7Days = newUsers7,
                FreePlans = freePlans,
                PaidPlans = paidPlans,
                TotalApiKeys = totalKeys,
                ActiveApiKeys = activeKeys,
                TotalWebhookEndpoints = totalWh,
                ActiveWebhookEndpoints = activeWh,
                LastSubscriptionCreated = lastSub?.CreatedDate,
                LastUserRegistered = lastUser?.CreatedDate,
                LastInvoiceCreated = lastInv?.CreatedDate,
                FailedWebhookDeliveriesLast24h = failedWhCount,
                PendingOutboxMessages = pendingOutboxCount,
                ExpiredApiKeys = expiredKeysCount,
                UnpaidInvoices = unpaidInvsCount,
                ExpiringSubscriptions7d = expiringSubsCount
            };
        }

        public async Task<UserDashboardDTO> GetUserDashboardAsync(Guid userId)
        {
            var now = DateTime.UtcNow;
            var since30 = now.AddDays(-30);

            var userRepo = _uow.Repository<AppUser>();
            var subRepo = _uow.Repository<Subscription>();
            var appRepo = _uow.Repository<App>();
            var planRepo = _uow.Repository<Plan>();
            var priceRepo = _uow.Repository<PlanPrice>();
            var regRepo = _uow.Repository<AppUserRegistration>();
            var invRepo = _uow.Repository<Invoice>();
            var invLineRepo = _uow.Repository<InvoiceLine>();

            var user = await userRepo.GetById(userId);
            if (user == null) throw new ArgumentException("User not found", nameof(userId));

            // SUBSCRIPTIONS
            var subsQ = await subRepo.GetBy(s => s.UserId == userId && s.Status != Status.Deleted);
            var totalSubs = await subsQ.CountAsync();
            var activeSubs = await subsQ.CountAsync(s => s.Status == Status.Active && (s.EndAt == null || s.EndAt > now));
            var cancelledSubs = await subsQ.CountAsync(s => s.Status == Status.Cancel);

            // SUBSCRIPTION DETAILS
            var subsList = await subsQ.ToListAsync();

            var subDetails = new List<UserSubscriptionDetailDTO>();

            foreach (var sub in subsList)
            {
                var app = await appRepo.GetById(sub.AppId);
                var plan = await planRepo.GetById(sub.PlanId);
                
                if (app == null || plan == null) continue;

                var prices = await priceRepo.GetBy(pp => 
                    pp.PlanId == sub.PlanId && 
                    pp.IsCurrent && 
                    pp.Status == Status.Active &&
                    pp.EffectiveFrom <= now &&
                    (pp.EffectiveTo == null || pp.EffectiveTo >= now)
                );

                var currentPrice = await prices
                    .OrderByDescending(p => p.EffectiveFrom)
                    .FirstOrDefaultAsync();

                subDetails.Add(new UserSubscriptionDetailDTO
                {
                    SubscriptionId = sub.Id,
                    AppId = sub.AppId,
                    AppName = app.Name,
                    AppCode = app.Code,
                    PlanId = sub.PlanId,
                    PlanName = plan.Name,
                    PlanCode = plan.Code,
                    StartAt = sub.StartAt,
                    EndAt = sub.EndAt,
                    RenewAt = sub.RenewAt,
                    IsActive = sub.Status == Status.Active && (sub.EndAt == null || sub.EndAt > now),
                    BillingPeriod = plan.BillingPeriod.ToString(),
                    PlanPrice = currentPrice?.Amount,
                    PlanPriceCurrency = currentPrice?.Currency.ToString(),
                    TrialDays = plan.TrialDays,
                    IsFreePlan = plan.IsFree
                });
            }

            // APP REGISTRATIONS
            var regsQ = await regRepo.GetBy(r => r.UserId == userId && r.Status != Status.Deleted);
            var regsList = await regsQ.ToListAsync();

            var appRegs = new List<UserAppRegistrationDTO>();

            foreach (var reg in regsList)
            {
                var app = await appRepo.GetById(reg.AppId);
                if (app == null) continue;

                var hasActiveSub = await subsQ.AnyAsync(s => 
                    s.AppId == reg.AppId && 
                    s.Status == Status.Active && 
                    (s.EndAt == null || s.EndAt > now)
                );

                appRegs.Add(new UserAppRegistrationDTO
                {
                    AppId = reg.AppId,
                    AppName = app.Name,
                    AppCode = app.Code,
                    RegisteredAt = reg.RegisteredAt != default ? reg.RegisteredAt : reg.CreatedDate,
                    HasActiveSubscription = hasActiveSub
                });
            }

            // TOTAL SPENT
            var invsQ = await invRepo.GetBy(i => i.UserId == userId && i.Status != Status.Deleted);
            var invIds = await invsQ.Select(i => i.Id).ToListAsync();
            
            decimal? totalSpent = null;
            string? totalSpentCur = null;

            if (invIds.Count > 0)
            {
                var lines = await invLineRepo.GetBy(l => invIds.Contains(l.InvoiceId));
                totalSpent = await lines.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
                
                var firstInv = await invsQ.FirstOrDefaultAsync();
                totalSpentCur = firstInv?.Currency.ToString();
            }

            // SPENT LAST 30 DAYS
            var inv30Q = await invRepo.GetBy(i => 
                i.UserId == userId && 
                i.CreatedDate >= since30 && 
                i.Status != Status.Deleted
            );
            var inv30Ids = await inv30Q.Select(i => i.Id).ToListAsync();
            
            decimal? spent30 = null;
            string? spent30Cur = null;

            if (inv30Ids.Count > 0)
            {
                var lines30 = await invLineRepo.GetBy(l => inv30Ids.Contains(l.InvoiceId));
                spent30 = await lines30.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
                
                var firstInv30 = await inv30Q.FirstOrDefaultAsync();
                spent30Cur = firstInv30?.Currency.ToString();
            }

            // LAST ACTIVITIES
            var lastSubCreated = await subsQ.OrderByDescending(s => s.CreatedDate).FirstOrDefaultAsync();
            var lastSubCancelled = await subsQ
                .Where(s => s.Status == Status.Cancel)
                .OrderByDescending(s => s.ModifiedDate)
                .FirstOrDefaultAsync();
            var lastReg = await regsQ.OrderByDescending(r => r.CreatedDate).FirstOrDefaultAsync();

            return new UserDashboardDTO
            {
                UserId = user.Id,
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                Phone = user.PhoneNumber,
                Status = (int)user.Status,
                TotalSubscriptions = totalSubs,
                ActiveSubscriptions = activeSubs,
                CancelledSubscriptions = cancelledSubs,
                TotalAppsRegistered = regsList.Count,
                AppsWithActiveSubscription = appRegs.Count(a => a.HasActiveSubscription),
                TotalSpent = totalSpent,
                TotalSpentCurrency = totalSpentCur,
                SpentLast30Days = spent30,
                SpentLast30DaysCurrency = spent30Cur,
                Subscriptions = subDetails,
                AppRegistrations = appRegs,
                LastSubscriptionCreated = lastSubCreated?.CreatedDate,
                LastSubscriptionCancelled = lastSubCancelled?.ModifiedDate,
                LastAppRegistered = lastReg?.CreatedDate
            };
        }

        public async Task<UserDashboardDTO> GetUserDashboardByEmailAsync(string email)
        {
            var userRepo = _uow.Repository<AppUser>();
            var user = await userRepo.GetBy(u => u.Email == email && u.Status != Status.Deleted);
            var userEntity = await user.FirstOrDefaultAsync();
            
            if (userEntity == null) throw new ArgumentException("User not found", nameof(email));

            return await GetUserDashboardAsync(userEntity.Id);
        }

        public async Task<AppDashboardDTO> GetAppDashboardAsync(Guid appId)
        {
            var now = DateTime.UtcNow;
            var since30 = now.AddDays(-30);
            var since7 = now.AddDays(-7);

            var appRepo = _uow.Repository<App>();
            var planRepo = _uow.Repository<Plan>();
            var priceRepo = _uow.Repository<PlanPrice>();
            var subRepo = _uow.Repository<Subscription>();
            var invRepo = _uow.Repository<Invoice>();
            var invLineRepo = _uow.Repository<InvoiceLine>();
            var featureRepo = _uow.Repository<Feature>();
            var keyRepo = _uow.Repository<ApiKey>();
            var whRepo = _uow.Repository<WebhookEndpoint>();
            var whdRepo = _uow.Repository<WebhookDelivery>();
            var regRepo = _uow.Repository<AppUserRegistration>();
            var userRepo = _uow.Repository<AppUser>();

            var app = await appRepo.GetById(appId);
            if (app == null) throw new ArgumentException("App not found", nameof(appId));

            // PLANS
            var plansQ = await planRepo.GetBy(p => p.AppId == appId && p.Status != Status.Deleted);
            var plansList = await plansQ.ToListAsync();
            var totalPlans = plansList.Count;
            var activePlans = plansList.Count(p => p.Status == Status.Active);

            var planDetails = new List<AppPlanDetailDTO>();
            foreach (var plan in plansList)
            {
                var currentPrice = await priceRepo.GetBy(pp =>
                    pp.PlanId == plan.Id &&
                    pp.IsCurrent &&
                    pp.Status == Status.Active &&
                    pp.EffectiveFrom <= now &&
                    (pp.EffectiveTo == null || pp.EffectiveTo >= now)
                );

                var price = await currentPrice
                    .OrderByDescending(p => p.EffectiveFrom)
                    .FirstOrDefaultAsync();

                var planSubs = await subRepo.GetBy(s => s.PlanId == plan.Id && s.Status != Status.Deleted);
                var subsCount = await planSubs.CountAsync();
                var activeSubsCount = await planSubs.CountAsync(s => s.Status == Status.Active && (s.EndAt == null || s.EndAt > now));

                planDetails.Add(new AppPlanDetailDTO
                {
                    PlanId = plan.Id,
                    PlanName = plan.Name,
                    PlanCode = plan.Code,
                    IsFree = plan.IsFree,
                    BillingPeriod = (int)plan.BillingPeriod,
                    TrialDays = plan.TrialDays,
                    CurrentPrice = price?.Amount,
                    CurrentPriceCurrency = price?.Currency.ToString(),
                    SubscriptionsCount = subsCount,
                    ActiveSubscriptionsCount = activeSubsCount
                });
            }

            // SUBSCRIPTIONS
            var subsQ = await subRepo.GetBy(s => s.AppId == appId && s.Status != Status.Deleted);
            var totalSubs = await subsQ.CountAsync();
            var activeSubs = await subsQ.CountAsync(s => s.Status == Status.Active && (s.EndAt == null || s.EndAt > now));
            var subsList = await subsQ.OrderByDescending(s => s.CreatedDate).Take(50).ToListAsync();

            var subDetails = new List<AppSubscriptionDetailDTO>();
            foreach (var sub in subsList)
            {
                var user = await userRepo.GetById(sub.UserId);
                var plan = await planRepo.GetById(sub.PlanId);
                
                if (user == null || plan == null) continue;

                var prices = await priceRepo.GetBy(pp =>
                    pp.PlanId == sub.PlanId &&
                    pp.IsCurrent &&
                    pp.Status == Status.Active &&
                    pp.EffectiveFrom <= now &&
                    (pp.EffectiveTo == null || pp.EffectiveTo >= now)
                );

                var currentPrice = await prices
                    .OrderByDescending(p => p.EffectiveFrom)
                    .FirstOrDefaultAsync();

                subDetails.Add(new AppSubscriptionDetailDTO
                {
                    SubscriptionId = sub.Id,
                    UserId = sub.UserId,
                    UserName = user.UserName ?? "",
                    UserEmail = user.Email ?? "",
                    PlanId = sub.PlanId,
                    PlanName = plan.Name,
                    StartAt = sub.StartAt,
                    EndAt = sub.EndAt,
                    IsActive = sub.Status == Status.Active && (sub.EndAt == null || sub.EndAt > now),
                    PlanPrice = currentPrice?.Amount,
                    PlanPriceCurrency = currentPrice?.Currency.ToString()
                });
            }

            // FEATURES
            var featuresQ = await featureRepo.GetBy(f => f.AppId == appId && f.Status != Status.Deleted);
            var featuresList = await featuresQ.ToListAsync();
            var featureDetails = featuresList.Select(f => new AppFeatureDetailDTO
            {
                FeatureId = f.Id,
                FeatureKey = f.Key,
                FeatureName = f.Name,
                FeatureUnit = f.Unit,
                Description = f.Description
            }).ToList();

            // API KEYS
            var keysQ = await keyRepo.GetBy(k => k.AppId == appId && k.Status != Status.Deleted);
            var keysList = await keysQ.OrderByDescending(k => k.CreatedDate).ToListAsync();
            var totalKeys = keysList.Count;
            var activeKeys = keysList.Count(k => k.Status == Status.Active);
            var keyDetails = keysList.Select(k => new AppApiKeyDetailDTO
            {
                Id = k.Id,
                Name = k.Name,
                Prefix = k.Prefix ?? "",
                ExpiresAt = k.ExpiresAt,
                CreatedDate = k.CreatedDate,
                IsActive = k.Status == Status.Active
            }).ToList();

            // WEBHOOK ENDPOINTS
            var whQ = await whRepo.GetBy(w => w.AppId == appId && w.Status != Status.Deleted);
            var whList = await whQ.ToListAsync();
            var totalWh = whList.Count;
            var activeWh = whList.Count(w => w.Status == Status.Active);

            var whDetails = new List<AppWebhookDetailDTO>();
            foreach (var wh in whList)
            {
                var lastDelQ = await whdRepo.GetBy(d => d.WebhookEndpointId == wh.Id);
                var lastDel = await lastDelQ
                    .OrderByDescending(d => d.CreatedDate)
                    .FirstOrDefaultAsync();

                whDetails.Add(new AppWebhookDetailDTO
                {
                    Id = wh.Id,
                    Url = wh.Url,
                    IsActive = wh.Status == Status.Active && wh.IsActive,
                    EventTypesCsv = wh.EventTypesCsv ?? "",
                    LastDeliveryAt = lastDel?.AttemptedAt,
                    LastDeliveryStatus = lastDel?.Status.ToString()
                });
            }

            // USER REGISTRATIONS
            var regsQ = await regRepo.GetBy(r => r.AppId == appId && r.Status != Status.Deleted);
            var regsList = await regsQ.OrderByDescending(r => r.CreatedDate).Take(50).ToListAsync();
            var totalRegs = await regsQ.CountAsync();

            var regDetails = new List<AppUserRegistrationDetailDTO>();
            foreach (var reg in regsList)
            {
                var user = await userRepo.GetById(reg.UserId);
                if (user == null) continue;

                var hasActiveSubQ = await subRepo.GetBy(s =>
                    s.AppId == appId &&
                    s.UserId == reg.UserId &&
                    s.Status == Status.Active &&
                    (s.EndAt == null || s.EndAt > now)
                );
                var hasActiveSub = await hasActiveSubQ.AnyAsync();

                regDetails.Add(new AppUserRegistrationDetailDTO
                {
                    UserId = reg.UserId,
                    UserName = user.UserName ?? "",
                    UserEmail = user.Email ?? "",
                    RegisteredAt = reg.RegisteredAt != default ? reg.RegisteredAt : reg.CreatedDate,
                    HasActiveSubscription = hasActiveSub
                });
            }

            // REVENUE
            var allInvsQ = await invRepo.GetBy(i => i.AppId == appId && i.Status != Status.Deleted);
            var allInvIds = await allInvsQ.Select(i => i.Id).ToListAsync();

            decimal? totalRevenue = null;
            string? totalRevenueCur = null;

            if (allInvIds.Count > 0)
            {
                var allLines = await invLineRepo.GetBy(l => allInvIds.Contains(l.InvoiceId));
                totalRevenue = await allLines.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
                var firstInv = await allInvsQ.FirstOrDefaultAsync();
                totalRevenueCur = firstInv?.Currency.ToString();
            }

            // REVENUE LAST 30 DAYS
            var inv30Q = await invRepo.GetBy(i => i.AppId == appId && i.CreatedDate >= since30 && i.Status != Status.Deleted);
            var inv30Ids = await inv30Q.Select(i => i.Id).ToListAsync();
            decimal? revenue30 = null;
            string? revenue30Cur = null;

            if (inv30Ids.Count > 0)
            {
                var lines30 = await invLineRepo.GetBy(l => inv30Ids.Contains(l.InvoiceId));
                revenue30 = await lines30.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
                var firstInv30 = await inv30Q.FirstOrDefaultAsync();
                revenue30Cur = firstInv30?.Currency.ToString();
            }

            // REVENUE LAST 7 DAYS
            var inv7Q = await invRepo.GetBy(i => i.AppId == appId && i.CreatedDate >= since7 && i.Status != Status.Deleted);
            var inv7Ids = await inv7Q.Select(i => i.Id).ToListAsync();
            decimal? revenue7 = null;
            string? revenue7Cur = null;

            if (inv7Ids.Count > 0)
            {
                var lines7 = await invLineRepo.GetBy(l => inv7Ids.Contains(l.InvoiceId));
                revenue7 = await lines7.SumAsync(l => (decimal?)(l.Amount * l.Quantity)) ?? 0m;
                var firstInv7 = await inv7Q.FirstOrDefaultAsync();
                revenue7Cur = firstInv7?.Currency.ToString();
            }

            // LAST ACTIVITIES
            var lastSubCreated = await subsQ.OrderByDescending(s => s.CreatedDate).FirstOrDefaultAsync();
            var lastReg = await regsQ.OrderByDescending(r => r.CreatedDate).FirstOrDefaultAsync();
            var lastInv = await allInvsQ.OrderByDescending(i => i.CreatedDate).FirstOrDefaultAsync();
            var lastFeat = await featuresQ.OrderByDescending(f => f.CreatedDate).FirstOrDefaultAsync();

            // OWNER
            var owner = app.OwnerUserId.HasValue ? await userRepo.GetById(app.OwnerUserId.Value) : null;

            return new AppDashboardDTO
            {
                AppId = app.Id,
                AppName = app.Name,
                AppCode = app.Code,
                Description = app.Description,
                Status = (int)app.Status,
                OwnerUserId = app.OwnerUserId,
                OwnerUserName = owner?.UserName,
                TotalPlans = totalPlans,
                ActivePlans = activePlans,
                TotalSubscriptions = totalSubs,
                ActiveSubscriptions = activeSubs,
                TotalUsersRegistered = totalRegs,
                TotalApiKeys = totalKeys,
                ActiveApiKeys = activeKeys,
                TotalWebhookEndpoints = totalWh,
                ActiveWebhookEndpoints = activeWh,
                TotalRevenue = totalRevenue,
                TotalRevenueCurrency = totalRevenueCur,
                RevenueLast30Days = revenue30,
                RevenueLast30DaysCurrency = revenue30Cur,
                RevenueLast7Days = revenue7,
                RevenueLast7DaysCurrency = revenue7Cur,
                Plans = planDetails,
                Subscriptions = subDetails,
                Features = featureDetails,
                ApiKeys = keyDetails,
                WebhookEndpoints = whDetails,
                UserRegistrations = regDetails,
                LastSubscriptionCreated = lastSubCreated?.CreatedDate,
                LastUserRegistered = lastReg?.CreatedDate,
                LastInvoiceCreated = lastInv?.CreatedDate,
                LastFeatureCreated = lastFeat?.CreatedDate
            };
        }
    }
}
