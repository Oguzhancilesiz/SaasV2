using Microsoft.Extensions.Logging;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Core.Payments;

namespace SaasV2.Services.Concrete.Payments
{
    public class MockPaymentProvider : IPaymentProvider
    {
        private readonly ILogger<MockPaymentProvider> _logger;

        public MockPaymentProvider(ILogger<MockPaymentProvider> logger)
        {
            _logger = logger;
        }

        public Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Mock payment provider processing invoice {InvoiceId} amount {Amount} {Currency}", request.InvoiceId, request.Amount, request.Currency);

            // Simple deterministic outcome: succeed for totals <= 10000, require action for >10000, fail if amount is zero.
            if (request.Amount <= 0)
            {
                return Task.FromResult(PaymentResult.Failed("amount_invalid", "Amount must be greater than zero."));
            }

            if (request.Amount > 10000)
            {
                return Task.FromResult(PaymentResult.RequireAction($"MOCK-{request.InvoiceId:N}".ToUpperInvariant()));
            }

            return Task.FromResult(PaymentResult.Success($"MOCK-{request.InvoiceId:N}".ToUpperInvariant()));
        }
    }
}

