using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Infrastructure
{
    public class SubscriptionRenewalBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<SubscriptionRenewalBackgroundService> _logger;
        private readonly TimeSpan _interval;

        public SubscriptionRenewalBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<SubscriptionRenewalBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
            _interval = TimeSpan.FromMinutes(15);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Subscription renewal background service started.");

            // Run once immediately
            await ProcessAsync(stoppingToken);

            using var timer = new PeriodicTimer(_interval);
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await ProcessAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // Expected when stoppingToken is cancelled.
            }

            _logger.LogInformation("Subscription renewal background service stopped.");
        }

        private async Task ProcessAsync(CancellationToken cancellationToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var renewalService = scope.ServiceProvider.GetRequiredService<ISubscriptionRenewalService>();
                var processed = await renewalService.ProcessDueRenewalsAsync(cancellationToken);
                if (processed > 0)
                {
                    _logger.LogInformation("Processed {Count} subscription renewals.", processed);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Subscription renewal processing failed.");
            }
        }
    }
}

