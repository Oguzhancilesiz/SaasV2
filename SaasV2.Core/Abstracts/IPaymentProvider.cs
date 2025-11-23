using SaasV2.Core.Payments;

namespace SaasV2.Core.Abstracts
{
    public interface IPaymentProvider
    {
        Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken cancellationToken = default);
    }
}

