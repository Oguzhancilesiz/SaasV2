using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using SaasV2.Core.Enums;
using SaasV2.DAL;
using SaasV2.Entity;
using System.Security.Cryptography;
using System.Text;

namespace SaasV2.API.Infrastructure
{
    public static class SeedData
    {
        public static async Task SeedAsync(this IServiceProvider sp)
        {
            try
            {
                using var scope = sp.CreateScope();
                var ctx = scope.ServiceProvider.GetRequiredService<BaseContext>();
                var um = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
                var rm = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

                await ctx.Database.MigrateAsync();

                var now = DateTime.UtcNow;

                // 1) Roles - Sadece Admin ve User
                await EnsureRoleAsync(rm, "Admin");
                await EnsureRoleAsync(rm, "User");

                // 2) Users - Sadece admin ve bir kullanıcı
                var admin = await EnsureUserAsync(um,
                    username: "admin",
                    email: "admin@example.com",
                    phone: "+90 555 000 0000",
                    password: "Ogzhn.123",
                    status: Status.Approved);
                await EnsureInRoleAsync(um, admin, "Admin");

                var user = await EnsureUserAsync(um,
                    username: "user",
                    email: "user@example.com",
                    phone: "+90 555 000 0001",
                    password: "Ogzhn.123",
                    status: Status.Approved);
                await EnsureInRoleAsync(um, user, "User");

                await ctx.SaveChangesAsync();

                // 3) Demo App - Tek bir demo app (Sabit ID ile)
                var demoAppId = Guid.Parse("455234cf-f7bc-4c83-93ad-6f4da5d1f803");
                var demoApp = await ctx.Set<App>().FirstOrDefaultAsync(a => a.Id == demoAppId || a.Code == "DEMO_APP");
                if (demoApp == null)
                {
                    demoApp = new App
                    {
                        Id = demoAppId, // Sabit ID
                        Name = "Demo Application",
                        Code = "DEMO_APP",
                        Description = "Demo uygulama - test amaçlı",
                        OwnerUserId = admin.Id,
                        Status = Status.Active,
                        CreatedDate = now,
                        ModifiedDate = now
                    };
                    ctx.Add(demoApp);
                    await ctx.SaveChangesAsync();
                }
                else if (demoApp.Id != demoAppId)
                {
                    // Eğer farklı ID ile varsa, ID'yi güncelle (migration için)
                    demoApp.Id = demoAppId;
                    await ctx.SaveChangesAsync();
                }

                // 4) Features - Basit feature'lar
                var fApiCalls = await EnsureFeatureAsync(ctx, "api_calls_day", "Günlük API Çağrısı", "call/day", "Günlük istek limiti.");
                var fStorage = await EnsureFeatureAsync(ctx, "storage_mb", "Depolama", "MB", "Medya/evrak depolama.");

                // 5) Plans - Demo app için basit planlar
                var freePlan = await EnsurePlanAsync(ctx, demoApp.Id, "Free", "FREE", "Ücretsiz plan", true, true, 0, BillingPeriod.Monthly);
                var basicPlan = await EnsurePlanAsync(ctx, demoApp.Id, "Basic", "BASIC", "Temel plan", true, false, 7, BillingPeriod.Monthly);
                var proPlan = await EnsurePlanAsync(ctx, demoApp.Id, "Pro", "PRO", "Profesyonel plan", true, false, 14, BillingPeriod.Monthly);

                await ctx.SaveChangesAsync();

                // 6) Plan Prices
                await EnsurePriceAsync(ctx, freePlan.Id, CurrencyCode.TRY, 0m, now, true);
                await EnsurePriceAsync(ctx, basicPlan.Id, CurrencyCode.TRY, 99m, now, true);
                await EnsurePriceAsync(ctx, proPlan.Id, CurrencyCode.TRY, 199m, now, true);

                // 7) Plan Features
                await EnsurePlanFeatureAsync(ctx, freePlan.Id, fApiCalls.Id, 100, ResetInterval.Daily, false, null);
                await EnsurePlanFeatureAsync(ctx, freePlan.Id, fStorage.Id, 100, ResetInterval.Monthly, false, null);

                await EnsurePlanFeatureAsync(ctx, basicPlan.Id, fApiCalls.Id, 1000, ResetInterval.Daily, true, 0.05m);
                await EnsurePlanFeatureAsync(ctx, basicPlan.Id, fStorage.Id, 1024, ResetInterval.Monthly, false, null);

                await EnsurePlanFeatureAsync(ctx, proPlan.Id, fApiCalls.Id, 10000, ResetInterval.Daily, true, 0.02m);
                await EnsurePlanFeatureAsync(ctx, proPlan.Id, fStorage.Id, 5120, ResetInterval.Monthly, false, null);

                await ctx.SaveChangesAsync();

                // 8) API Key - Demo app için
                var existingApiKey = await ctx.Set<ApiKey>().FirstOrDefaultAsync(k => k.AppId == demoApp.Id && k.Status != Status.Deleted);
                ApiKey? demoApiKey = null;
                if (existingApiKey == null)
                {
                    demoApiKey = NewApiKey(demoApp.Id, "Demo App API Key");
                    ctx.Add(demoApiKey);
                    await ctx.SaveChangesAsync();
                    
                    // API Key'i console'a yazdır (demo app için kullanılacak)
                    var apiKeyFull = $"{demoApiKey.Prefix}_{demoApiKey.Hash}";
                    Console.WriteLine("========================================");
                    Console.WriteLine("DEMO APP API KEY (Demo App için kullanın):");
                    Console.WriteLine($"App ID: {demoApp.Id}");
                    Console.WriteLine($"App Code: {demoApp.Code}");
                    Console.WriteLine($"API Key: {apiKeyFull}");
                    Console.WriteLine("========================================");
                }
                else
                {
                    demoApiKey = existingApiKey;
                    var apiKeyFull = $"{existingApiKey.Prefix}_{existingApiKey.Hash}";
                    Console.WriteLine("========================================");
                    Console.WriteLine("DEMO APP API KEY (Mevcut):");
                    Console.WriteLine($"App ID: {demoApp.Id}");
                    Console.WriteLine($"App Code: {demoApp.Code}");
                    Console.WriteLine($"API Key: {apiKeyFull}");
                    Console.WriteLine("========================================");
                }

                // 9) AppUserRegistration - Kullanıcıyı demo app'e kaydet
                var existingReg = await ctx.Set<AppUserRegistration>()
                    .FirstOrDefaultAsync(r => r.UserId == user.Id && r.AppId == demoApp.Id && r.Status != Status.Deleted);
                if (existingReg == null)
                {
                    ctx.Add(NewReg(demoApp.Id, user.Id));
                    await ctx.SaveChangesAsync();
                }

                // 10) Subscription - Kullanıcı için basic plan subscription
                var existingSub = await ctx.Set<Subscription>()
                    .FirstOrDefaultAsync(s => s.UserId == user.Id && s.AppId == demoApp.Id && s.Status != Status.Deleted);
                if (existingSub == null)
                {
                    var subscription = new Subscription
                    {
                        Id = Guid.NewGuid(),
                        AppId = demoApp.Id,
                        UserId = user.Id,
                        PlanId = basicPlan.Id,
                        StartAt = now.AddDays(-7),
                        EndAt = null,
                        RenewAt = now.AddDays(23),
                        RenewalPolicy = RenewalPolicy.Auto,
                        ExternalPaymentRef = $"PMT-{Guid.NewGuid().ToString("N")[..10]}",
                        Status = Status.Active,
                        CreatedDate = now,
                        ModifiedDate = now
                    };
                    ctx.Add(subscription);

                    // Subscription Items
                    var planFeatures = await ctx.Set<PlanFeature>()
                        .Where(pf => pf.PlanId == basicPlan.Id && pf.Status != Status.Deleted)
                        .ToListAsync();

                    foreach (var pf in planFeatures)
                    {
                        ctx.Add(new SubscriptionItem
                        {
                            Id = Guid.NewGuid(),
                            SubscriptionId = subscription.Id,
                            FeatureId = pf.FeatureId,
                            Allotted = pf.Limit,
                            Used = 0,
                            ResetsAt = pf.ResetInterval switch
                            {
                                ResetInterval.Daily => DateTime.UtcNow.Date.AddDays(1),
                                ResetInterval.Weekly => DateTime.UtcNow.Date.AddDays(7),
                                ResetInterval.Monthly => DateTime.UtcNow.Date.AddMonths(1),
                                _ => null
                            },
                            Status = Status.Active,
                            CreatedDate = now,
                            ModifiedDate = now
                        });
                    }

                    await ctx.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                // Log the exception for debugging
                Console.WriteLine($"Seed data error: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                throw; // Re-throw to be caught by Program.cs
            }
        }

        private static async Task EnsureRoleAsync(RoleManager<AppRole> rm, string roleName)
        {
            if (!await rm.Roles.AnyAsync(r => r.Name == roleName))
            {
                var role = new AppRole
                {
                    Id = Guid.NewGuid(),
                    Name = roleName,
                    Status = Status.Active,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow
                };
                await rm.CreateAsync(role);
            }
        }

        private static async Task<AppUser> EnsureUserAsync(
            UserManager<AppUser> um,
            string username,
            string email,
            string phone,
            string password,
            Status status)
        {
            var u = await um.FindByNameAsync(username);
            if (u != null) return u;

            u = new AppUser
            {
                Id = Guid.NewGuid(),
                UserName = username,
                Email = email,
                PhoneNumber = phone,
                EmailConfirmed = true,
                PhoneNumberConfirmed = true,
                Status = status,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
            var res = await um.CreateAsync(u, password);
            if (!res.Succeeded)
            {
                var msg = string.Join(" | ", res.Errors.Select(e => e.Description));
                throw new Exception($"User create failed ({username}): {msg}");
            }
            return u;
        }

        private static async Task EnsureInRoleAsync(UserManager<AppUser> um, AppUser user, string role)
        {
            var roles = await um.GetRolesAsync(user);
            if (!roles.Contains(role))
                await um.AddToRoleAsync(user, role);
        }

        private static async Task<Feature> EnsureFeatureAsync(BaseContext ctx, string key, string name, string unit, string desc)
        {
            var existing = await ctx.Set<Feature>().FirstOrDefaultAsync(f => f.Key == key);
            if (existing != null) return existing;

            var feature = new Feature
            {
                Id = Guid.NewGuid(),
                Key = key,
                Name = name,
                Unit = unit,
                Description = desc,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
            ctx.Add(feature);
            await ctx.SaveChangesAsync();
            return feature;
        }

        private static async Task<Plan> EnsurePlanAsync(BaseContext ctx, Guid appId, string name, string code, string desc, bool isPublic, bool isFree, int trialDays, BillingPeriod period)
        {
            var existing = await ctx.Set<Plan>().FirstOrDefaultAsync(p => p.AppId == appId && p.Code == code && p.Status != Status.Deleted);
            if (existing != null) return existing;

            var plan = NewPlan(appId, name, code, desc, isPublic, isFree, trialDays, period);
            ctx.Add(plan);
            await ctx.SaveChangesAsync();
            return plan;
        }

        private static async Task EnsurePriceAsync(BaseContext ctx, Guid planId, CurrencyCode cur, decimal amount, DateTime from, bool isCurrent)
        {
            var existing = await ctx.Set<PlanPrice>()
                .FirstOrDefaultAsync(p => p.PlanId == planId && p.Currency == cur && p.IsCurrent == isCurrent && p.Status != Status.Deleted);
            
            if (existing != null) return;

            var price = NewPrice(planId, cur, amount, from, isCurrent);
            ctx.Add(price);
            await ctx.SaveChangesAsync();
        }

        private static async Task EnsurePlanFeatureAsync(BaseContext ctx, Guid planId, Guid featureId, decimal? limit, ResetInterval reset, bool allowOverage, decimal? overuse)
        {
            var existing = await ctx.Set<PlanFeature>()
                .FirstOrDefaultAsync(pf => pf.PlanId == planId && pf.FeatureId == featureId && pf.Status != Status.Deleted);
            
            if (existing != null) return;

            var planFeature = NewPlanFeature(planId, featureId, limit, reset, allowOverage, overuse);
            ctx.Add(planFeature);
            await ctx.SaveChangesAsync();
        }

        private static Plan NewPlan(Guid appId, string name, string code, string desc, bool isPublic, bool isFree, int trialDays, BillingPeriod period)
        {
            return new Plan
            {
                Id = Guid.NewGuid(),
                AppId = appId,
                Name = name,
                Code = code,
                Description = desc,
                IsPublic = isPublic,
                IsFree = isFree,
                TrialDays = trialDays,
                BillingPeriod = period,
                RenewalPolicy = RenewalPolicy.Auto,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
        }

        private static PlanPrice NewPrice(Guid planId, CurrencyCode cur, decimal amount, DateTime from, bool isCurrent)
        {
            return new PlanPrice
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                Currency = cur,
                Amount = amount,
                EffectiveFrom = from,
                EffectiveTo = null,
                IsCurrent = isCurrent,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
        }

        private static PlanFeature NewPlanFeature(Guid planId, Guid featureId, decimal? limit, ResetInterval reset, bool allowOverage, decimal? overuse)
        {
            return new PlanFeature
            {
                Id = Guid.NewGuid(),
                PlanId = planId,
                FeatureId = featureId,
                Limit = limit,
                ResetInterval = reset,
                AllowOverage = allowOverage,
                OverusePrice = overuse,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
        }

        private static AppUserRegistration NewReg(Guid appId, Guid userId)
        {
            var shortUser = userId.ToString("N")[..12];
            return new AppUserRegistration
            {
                Id = Guid.NewGuid(),
                AppId = appId,
                UserId = userId,
                RegisteredAt = DateTime.UtcNow.AddDays(-7),
                Provider = "local",
                ExternalId = $"local:{shortUser}@{appId.ToString("N")[..6]}",
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
        }

        private static ApiKey NewApiKey(Guid appId, string name)
        {
            var prefix = "sk_live_" + Guid.NewGuid().ToString("N")[..8];
            var secret = "SECRET_" + Guid.NewGuid().ToString("N");
            using var sha = SHA256.Create();
            var hash = Convert.ToHexString(sha.ComputeHash(Encoding.UTF8.GetBytes(secret)));

            return new ApiKey
            {
                Id = Guid.NewGuid(),
                AppId = appId,
                Name = name,
                Prefix = prefix,
                Hash = hash,
                Scopes = "public,usage:write,subscription:read",
                ExpiresAt = DateTime.UtcNow.AddYears(2),
                LastUsedAt = null,
                Status = Status.Active,
                CreatedDate = DateTime.UtcNow,
                ModifiedDate = DateTime.UtcNow
            };
        }
    }
}
