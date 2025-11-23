using System.Threading;
using System.Threading.Tasks;

namespace SaasV2.Services.Abstracts
{
    public interface ISubscriptionRenewalService
    {
        /// <summary>
        /// Processes subscriptions that reached their renewal date and generates invoices.
        /// Returns the number of successfully renewed subscriptions.
        /// </summary>
        Task<int> ProcessDueRenewalsAsync(CancellationToken cancellationToken = default);
    }
}

