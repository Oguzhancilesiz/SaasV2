using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SaasV2.API.Infrastructure;
using SaasV2.Core.Abstracts;
using SaasV2.DAL;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using SaasV2.Services.Concrete;
using SaasV2.Services.Concrete.Payments;

var builder = WebApplication.CreateBuilder(args);

// MVC / API
builder.Services.AddControllers(); // veya AddControllersWithViews()

// Db
builder.Services.AddDbContext<BaseContext>((serviceProvider, options) =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("dbCon"));
}, ServiceLifetime.Scoped);

// BaseContext factory - IServiceProvider'ı inject etmek için
builder.Services.AddScoped<BaseContext>(sp =>
{
    var options = sp.GetRequiredService<DbContextOptions<BaseContext>>();
    return new BaseContext(options, sp);
});

builder.Services.AddDistributedMemoryCache();
builder.Services.AddMemoryCache();

builder.Services.Configure<PaymentProviderOptions>(builder.Configuration.GetSection("Payments"));
builder.Services.Configure<SaasV2.Core.Configuration.SmtpOptions>(builder.Configuration.GetSection("Smtp"));
builder.Services.AddHttpClient<StripePaymentProvider>();
builder.Services.AddHttpClient<IyzicoPaymentProvider>();
builder.Services.AddScoped<StripePaymentProvider>();
builder.Services.AddScoped<IyzicoPaymentProvider>();
builder.Services.AddScoped<MockPaymentProvider>();

// Session
builder.Services.AddSession(o =>
{
    o.IdleTimeout = TimeSpan.FromMinutes(30);
    o.Cookie.HttpOnly = true;
    o.Cookie.IsEssential = true;
});

// Identity
builder.Services.AddIdentity<AppUser, AppRole>(opt =>
{
    opt.User.RequireUniqueEmail = true;
    opt.Password.RequiredLength = 3;
    opt.Password.RequireDigit = false;
    opt.Password.RequiredUniqueChars = 0;
    opt.Password.RequireUppercase = false;
    opt.Password.RequireNonAlphanumeric = false;
    opt.Password.RequireLowercase = false;
})
.AddEntityFrameworkStores<BaseContext>();

// Identity'nin kendi cookie authentication'ını özelleştir
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = ".SaasV2.AdminAuth";
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.LoginPath = "/auth/login";
    options.LogoutPath = "/auth/logout";
    options.AccessDeniedPath = "/auth/access-denied";
    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        context.Response.StatusCode = StatusCodes.Status403Forbidden;
        return Task.CompletedTask;
    };
});

// API Key Authentication - Identity'nin cookie authentication'ına ek olarak
builder.Services.AddAuthentication()
.AddScheme<AuthenticationSchemeOptions, ApiKeyAuthenticationHandler>(
    ApiKeyAuthenticationHandler.AuthenticationScheme,
    options => { });

builder.Services.AddAuthorization(options =>
{
    // API Key veya Admin rolü gerektiren policy
    options.AddPolicy("ApiKeyOrAdmin", policy =>
    {
        policy.AddAuthenticationSchemes(
            ApiKeyAuthenticationHandler.AuthenticationScheme,
            Microsoft.AspNetCore.Identity.IdentityConstants.ApplicationScheme);
        policy.RequireAssertion(context =>
        {
            // API Key ile authenticate olmuşsa izin ver
            if (context.User.Identity?.AuthenticationType == ApiKeyAuthenticationHandler.AuthenticationScheme)
            {
                return true;
            }
            // Admin rolü varsa izin ver
            return context.User.IsInRole(AdminAuthorizeAttribute.RequiredRole);
        });
    });
});


// CORS: Next.js dev server ve Demo App (HTTP ve HTTPS)
builder.Services.AddCors(o =>
{
    o.AddPolicy("NextJs", p => p
        .WithOrigins(
            "http://localhost:3000",
            "https://localhost:3000",
            "http://localhost:3001",
            "https://localhost:3001",
            "http://localhost:5173",  // Vite dev server (Demo App)
            "https://localhost:5173"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// IOC
builder.Services.AddHttpContextAccessor(); // ActivityLog için
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IEFContext, BaseContext>();

builder.Services.AddScoped<IAppCompositeService, AppCompositeService>();
builder.Services.AddScoped<IApiKeyService, ApiKeyService>();
builder.Services.AddScoped<IAppService, AppService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<SaasV2.Services.Concrete.UserClaimService>();
builder.Services.AddScoped<SaasV2.Services.Concrete.UserLoginService>();
builder.Services.AddScoped<SaasV2.Services.Concrete.RoleClaimService>();
builder.Services.AddScoped<IAppUserRegistrationService, AppUserRegistrationService>();
builder.Services.AddScoped<IFeatureService, FeatureService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IOutboxService, OutboxService>();
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped<IPlanFeatureService, PlanFeatureService>();
builder.Services.AddScoped<IPlanPriceService, PlanPriceService>();
builder.Services.AddScoped<ISubscriptionService, SubscriptionService>();
builder.Services.AddScoped<IUsageRecordService, UsageRecordService>();
builder.Services.AddScoped<ISubscriptionRenewalService, SubscriptionRenewalService>();
builder.Services.AddScoped<IPaymentProvider, SwitchingPaymentProvider>();
builder.Services.AddScoped<IPaymentWorkflowService, PaymentWorkflowService>();

builder.Services.AddHttpClient("webhook")
    .ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler { AllowAutoRedirect = false })
    .SetHandlerLifetime(TimeSpan.FromMinutes(5));

builder.Services.AddScoped<IWebhookEndpointService, WebhookEndpointService>();
builder.Services.AddScoped<IWebhookDeliveryService, WebhookDeliveryService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IActivityLogService, ActivityLogService>();
builder.Services.AddScoped<IAppSettingService, AppSettingService>();
builder.Services.AddScoped<SaasV2.Services.Abstracts.IEmailService, SaasV2.Services.Concrete.EmailService>();
builder.Services.AddScoped<SaasV2.Services.Abstracts.IEmailVerificationService, SaasV2.Services.Concrete.EmailVerificationService>();
builder.Services.AddHostedService<SubscriptionRenewalBackgroundService>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseRouting();

// CORS'un Authentication'dan ÖNCE olması gerekiyor
app.UseCors("NextJs");

app.UseSession();
app.UseAuthentication();
app.UseAuthorization();

// API Key middleware'i kaldırıldı - artık Authentication Handler kullanılıyor
// app.UseMiddleware<ApiKeyAuthenticationMiddleware>();

// Controller'ları map et - RequireAuthorization() kaldırıldı
// Çünkü her controller kendi [AdminAuthorize] veya [AllowAnonymous] attribute'üne sahip
app.MapControllers();

// Seed Data
try
{
    await app.Services.SeedAsync();
}
catch (Exception)
{
    // Don't stop the app, just silently continue
}

app.Run();
