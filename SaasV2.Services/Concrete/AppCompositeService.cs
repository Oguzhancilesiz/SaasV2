using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.AppDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System.Security.Cryptography;
using System.Text;
using RenewalPolicy = SaasV2.Core.Enums.RenewalPolicy;

public class AppCompositeService : IAppCompositeService
{
    private readonly IUnitOfWork _uow;
    public AppCompositeService(IUnitOfWork uow) => _uow = uow;

    public async Task<AppProvisionResult> ProvisionAsync(AppProvisionRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name)) throw new ArgumentException("Name zorunlu.");
        if (string.IsNullOrWhiteSpace(req.Code)) throw new ArgumentException("Code zorunlu.");

        var appRepo = _uow.Repository<App>();
        var planRepo = _uow.Repository<Plan>();
        var priceRepo = _uow.Repository<PlanPrice>();
        var pfRepo = _uow.Repository<PlanFeature>();
        var keyRepo = _uow.Repository<ApiKey>();
        var whRepo = _uow.Repository<WebhookEndpoint>();

        var now = DateTime.UtcNow;
        var name = req.Name.Trim();
        var code = req.Code.Trim();

        // app code tekillik
        var exists = await appRepo.AnyAsync(x => x.Status != Status.Deleted && (x.Name == name || x.Code == code));
        if (exists) throw new InvalidOperationException("Aynı isim veya Code zaten mevcut.");

        // APP
        string? workspaceKey = string.IsNullOrWhiteSpace(req.WorkspaceKey)
            ? null
            : req.WorkspaceKey.Trim();

        if (!string.IsNullOrEmpty(workspaceKey))
        {
            var workspaceExists = await appRepo.AnyAsync(x =>
                x.Status != Status.Deleted &&
                x.WorkspaceKey == workspaceKey);

            if (workspaceExists) throw new InvalidOperationException("Workspace anahtarı kullanımda.");
        }

        var environment = req.Environment ?? AppEnvironment.Production;
        var ownerEmail = NormalizeEmail(req.OwnerContactEmail);
        var billingEmail = NormalizeEmail(req.BillingContactEmail);
        var notes = string.IsNullOrWhiteSpace(req.Notes) ? null : req.Notes.Trim();

        var app = new App
        {
            Id = Guid.NewGuid(),
            Name = name,
            Code = code,
            Description = req.Description?.Trim(),
            OwnerUserId = req.OwnerUserId,
            Environment = environment,
            WorkspaceKey = workspaceKey,
            OwnerContactEmail = ownerEmail,
            BillingContactEmail = billingEmail,
            Notes = notes,
            Status = Status.Active,
            CreatedDate = now,
            ModifiedDate = now
        };
        await appRepo.AddAsync(app);

        var createdPlanIds = new List<Guid>();

        // PLANLAR
        foreach (var p in req.Plans ?? Enumerable.Empty<PlanSeed>())
        {
            var pName = p.Name?.Trim();
            var pCode = p.Code?.Trim();
            if (string.IsNullOrWhiteSpace(pName) || string.IsNullOrWhiteSpace(pCode))
                throw new ArgumentException("Plan Name ve Code zorunlu.");

            // plan code tekillik (app içinde)
            var planExists = await planRepo.AnyAsync(x => x.AppId == app.Id && x.Status != Status.Deleted && x.Code == pCode);
            if (planExists) throw new InvalidOperationException($"Plan Code zaten var: {pCode}");

                   var plan = new Plan
                   {
                       Id = Guid.NewGuid(),
                       AppId = app.Id,
                       Name = pName,
                       Code = pCode,
                       Description = p.Description?.Trim() ?? string.Empty,
                       IsPublic = true,
                       IsFree = p.Prices == null || p.Prices.Count == 0 || p.Prices.All(pr => pr.Amount == 0),
                       TrialDays = p.TrialDays,
                       BillingPeriod = p.BillingInterval ?? BillingPeriod.Monthly,
                       RenewalPolicy = RenewalPolicy.Auto,
                       Status = p.Active ? Status.Active : Status.DeActive,
                       CreatedDate = now,
                       ModifiedDate = now
                   };
            await planRepo.AddAsync(plan);
            createdPlanIds.Add(plan.Id);

            // FİYATLAR
            foreach (var pr in p.Prices ?? Enumerable.Empty<PlanPriceSeed>())
            {
                var price = new PlanPrice
                {
                    Id = Guid.NewGuid(),
                    PlanId = plan.Id,
                    Currency = pr.Currency,
                    Amount = pr.Amount,
                    EffectiveFrom = pr.EffectiveFrom ?? now,
                    EffectiveTo = null,
                    IsCurrent = true,
                    Status = Status.Active,
                    CreatedDate = now,
                    ModifiedDate = now
                };
                await priceRepo.AddAsync(price);
            }

            // FEATURE İLİŞKİLERİ
            foreach (var fid in p.FeatureIds ?? Enumerable.Empty<Guid>())
            {
                var pf = new PlanFeature
                {
                    Id = Guid.NewGuid(),
                    PlanId = plan.Id,
                    FeatureId = fid,
                    Status = Status.Active,
                    CreatedDate = now,
                    ModifiedDate = now
                };
                await pfRepo.AddAsync(pf);
            }
        }

        // API KEY
        var result = new AppProvisionResult { AppId = app.Id, PlanIds = createdPlanIds };
        if (req.CreateApiKey)
        {
            // raw key üret: PREFIX-xxxxxxxx… formatı
            var prefix = CreatePrefix(code);
            var raw = $"{prefix}.{Guid.NewGuid():N}{RandomNumberGenerator.GetInt32(1000, 9999)}";

            // Hash (sadece hash sakla)
            var hash = Sha256(raw);

            var apiKey = new ApiKey
            {
                Id = Guid.NewGuid(),
                AppId = app.Id,
                Name = string.IsNullOrWhiteSpace(req.ApiKeyName) ? "Default" : req.ApiKeyName.Trim(),
                Prefix = prefix,
                Hash = hash,
                Scopes = string.Empty, // Required field - boş string = tüm yetkiler
                ExpiresAt = req.ApiKeyExpiresAt,
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now
            };
            await keyRepo.AddAsync(apiKey);

            result.ApiKeyCreated = true;
            result.ApiKeyRaw = raw; // UI'da tek defa göster
            result.ApiKeyMasked = prefix.Length <= 4 ? $"{prefix}••••" : $"{prefix[..4]}••••";
            result.ApiKeyExpiresAt = req.ApiKeyExpiresAt;
        }

        // WEBHOOK
        if (req.CreateWebhook && !string.IsNullOrWhiteSpace(req.WebhookUrl))
        {
            var ep = new WebhookEndpoint
            {
                Id = Guid.NewGuid(),
                AppId = app.Id,
                Url = req.WebhookUrl!.Trim(),
                Secret = req.WebhookSecret ?? string.Empty,
                IsActive = true,
                EventTypesCsv = string.Empty,
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now
            };
            await whRepo.AddAsync(ep);
            result.WebhookCreated = true;
            result.WebhookEndpointId = ep.Id;
        }

        await _uow.SaveChangesAsync();
        return result;
    }

    private static string? NormalizeEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        return email.Trim().ToLowerInvariant();
    }

    private static string CreatePrefix(string code)
    {
        // CODE’dan güvenli bir prefix çıkar (A-Z0-9), 6 karakter
        var sb = new StringBuilder();
        foreach (var ch in code.ToUpperInvariant())
            if ((ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9'))
                sb.Append(ch);
        var cleaned = sb.ToString();
        if (string.IsNullOrEmpty(cleaned)) cleaned = "APP";
        return cleaned.Length > 6 ? cleaned[..6] : cleaned.PadRight(6, 'X');
    }

    private static string Sha256(string input)
    {
        using var sha = SHA256.Create();
        var bytes = sha.ComputeHash(Encoding.UTF8.GetBytes(input));
        var hex = new StringBuilder(bytes.Length * 2);
        foreach (var b in bytes) hex.Append(b.ToString("x2"));
        return hex.ToString();
    }

    public Task<List<AppDashboardSummaryDTO>> GetAppDashboardBatchAsync(IEnumerable<Guid> appIds)
        => Task.WhenAll(appIds.Select(GetAppDashboardAsync)).ContinueWith(t => t.Result.ToList());

    public async Task<AppDashboardSummaryDTO> GetAppDashboardAsync(Guid appId)
    {
        var now = DateTime.UtcNow;

        var planRepo = _uow.Repository<Plan>();
        var priceRepo = _uow.Repository<PlanPrice>();
        var subsRepo = _uow.Repository<Subscription>();
        var keyRepo = _uow.Repository<ApiKey>();
        var whRepo = _uow.Repository<WebhookEndpoint>();
        var whdRepo = _uow.Repository<WebhookDelivery>();
        var usageRepo = _uow.Repository<UsageRecord>();
        var regRepo = _uow.Repository<AppUserRegistration>();
        var invRepo = _uow.Repository<Invoice>();
        var invLineRepo = _uow.Repository<InvoiceLine>();

        // ---------- PLANS ----------
        var plansQ = await planRepo.GetBy(p => p.AppId == appId && p.Status != Status.Deleted);
        var plansActive = await plansQ.CountAsync(p => p.Status == Status.Active);
        var plansInactive = await plansQ.CountAsync(p => p.Status != Status.Active && p.Status != Status.Deleted);
        var planIds = await plansQ.Select(p => p.Id).ToListAsync();

        decimal? cheapest = null, highest = null;
        string? cheapestCur = null, highestCur = null;

        if (planIds.Count > 0)
        {
            var pricesQ = await priceRepo.GetBy(pp => planIds.Contains(pp.PlanId) && pp.Status == Status.Active);
            var minRow = await pricesQ.OrderBy(pp => pp.Amount).FirstOrDefaultAsync();
            var maxRow = await pricesQ.OrderByDescending(pp => pp.Amount).FirstOrDefaultAsync();

            if (minRow != null) { cheapest = minRow.Amount; cheapestCur = minRow.Currency.ToString(); }
            if (maxRow != null) { highest = maxRow.Amount; highestCur = maxRow.Currency.ToString(); }
        }

        // ---------- SUBSCRIPTIONS ----------
        var subsAllQ = await subsRepo.GetBy(s => s.AppId == appId && s.Status != Status.Deleted);
        var subsTotal = await subsAllQ.CountAsync();
        var subsActive = await subsAllQ.CountAsync(s => s.Status == Status.Active);

        // ---------- REVENUE (last 30d) : Invoice + InvoiceLine ----------
        var since30 = now.AddDays(-30);
        var invQ = await invRepo.GetBy(i => i.AppId == appId && i.CreatedDate >= since30 /* && i.Status == Status.Paid */);
        var invIds = await invQ.Select(i => i.Id).ToListAsync();

        decimal? revenue30 = null;
        string? revenueCur = null;

        if (invIds.Count > 0)
        {
            var linesQ = await invLineRepo.GetBy(l => invIds.Contains(l.InvoiceId));
            var sum = await linesQ.SumAsync(l => (decimal?)(l.Amount * l.Quantity));
            revenue30 = sum ?? 0m;

            var curRow = await invQ.Select(i => new { i.Currency }).FirstOrDefaultAsync();
            revenueCur = curRow?.Currency.ToString();
        }

        // ---------- API KEYS ----------
        var keysQ = await keyRepo.GetBy(k => k.AppId == appId && k.Status == Status.Active);
        var apiKeysActive = await keysQ.CountAsync();
        var latestKey = await keysQ.OrderByDescending(k => k.CreatedDate).FirstOrDefaultAsync();

        // DB tasarımında raw key yok; Prefix + Hash var. O yüzden maske sadece Prefix üzerinden.
        string? latestKeyMasked = null;
        if (latestKey != null && !string.IsNullOrWhiteSpace(latestKey.Prefix))
        {
            var pre = latestKey.Prefix!;
            latestKeyMasked = pre.Length <= 4 ? $"{pre}••••" : $"{pre[..4]}••••";
        }

        // ---------- WEBHOOKS ----------
        var whActiveQ = await whRepo.GetBy(w => w.AppId == appId && w.Status == Status.Active);
        var whActives = await whActiveQ.CountAsync();
        var endpointIds = await whActiveQ.Select(w => w.Id).ToListAsync();

        DateTime? lastWhAt = null;
        string? lastWhStatus = null;

        if (endpointIds.Count > 0)
        {
            var delQ = await whdRepo.GetBy(d => endpointIds.Contains(d.WebhookEndpointId));
            var lastDel = await delQ
                .OrderByDescending(d => d.CreatedDate)
                .Select(d => new { d.CreatedDate, d.Status })
                .FirstOrDefaultAsync();

            lastWhAt = lastDel?.CreatedDate;
            lastWhStatus = lastDel?.Status.ToString();
        }

        // ---------- USAGE (last 7d) ----------
        var since7 = now.AddDays(-7);
        long usage7 = await (await usageRepo.GetBy(u => u.AppId == appId && u.CreatedDate >= since7))
            .SumAsync(u => (long?)u.Quantity ?? 0L);

        // ---------- REGISTRATIONS (last 7d) ----------
        var regs7 = await (await regRepo.GetBy(r => r.AppId == appId && r.CreatedDate >= since7)).CountAsync();

        return new AppDashboardSummaryDTO
        {
            AppId = appId,
            PlansActive = plansActive,
            PlansInactive = plansInactive,
            CheapestPrice = cheapest,
            CheapestPriceCurrency = cheapestCur,
            HighestPrice = highest,
            HighestPriceCurrency = highestCur,
            SubscriptionsTotal = subsTotal,
            SubscriptionsActive = subsActive,
            RevenueLast30d = revenue30,
            RevenueCurrency = revenueCur,
            ApiKeysActive = apiKeysActive,
            LatestApiKeyCreated = latestKey?.CreatedDate,
            LatestApiKeyMasked = latestKeyMasked,
            WebhookEndpointsActive = whActives,
            LastWebhookDeliveryAt = lastWhAt,
            LastWebhookDeliveryStatus = lastWhStatus,
            UsageEventsLast7d = usage7,
            RegistrationsLast7d = regs7
        };
    }
}
