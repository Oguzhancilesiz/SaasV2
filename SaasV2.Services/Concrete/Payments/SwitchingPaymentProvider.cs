using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Payments;

namespace SaasV2.Services.Concrete.Payments
{
    public class SwitchingPaymentProvider : IPaymentProvider
    {
        private readonly StripePaymentProvider _stripeProvider;
        private readonly IyzicoPaymentProvider _iyzicoProvider;
        private readonly MockPaymentProvider _mockProvider;
        private readonly PaymentProviderOptions _options;
        private readonly ILogger<SwitchingPaymentProvider> _logger;

        public SwitchingPaymentProvider(
            StripePaymentProvider stripeProvider,
            IyzicoPaymentProvider iyzicoProvider,
            MockPaymentProvider mockProvider,
            IOptions<PaymentProviderOptions> options,
            ILogger<SwitchingPaymentProvider> logger)
        {
            _stripeProvider = stripeProvider;
            _iyzicoProvider = iyzicoProvider;
            _mockProvider = mockProvider;
            _options = options.Value;
            _logger = logger;
        }

        public Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken cancellationToken = default)
        {
            var providerKey = Normalize(request.ProviderName) ?? Normalize(_options.Provider) ?? "stripe";
            request.ProviderName = providerKey;

            IPaymentProvider provider = providerKey switch
            {
                "stripe" => _stripeProvider,
                "iyzico" => _iyzicoProvider,
                "mock" => _mockProvider,
                _ => _stripeProvider
            };

            _logger.LogDebug("Routing payment request for invoice {InvoiceId} to provider {Provider}.", request.InvoiceId, providerKey);

            return provider.ChargeAsync(request, cancellationToken);
        }

        private static string? Normalize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Trim().ToLowerInvariant();
        }
    }
}

