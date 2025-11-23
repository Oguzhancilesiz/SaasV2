using SaasV2.Core.Enums;
using System.Collections.Generic;

namespace SaasV2.Core.Payments
{
    public class PaymentRequest
    {
        public Guid InvoiceId { get; set; }
        public Guid AppId { get; set; }
        public Guid UserId { get; set; }
        public decimal Amount { get; set; }
        public CurrencyCode Currency { get; set; }
        public string Description { get; set; } = string.Empty;
        public IDictionary<string, string>? Metadata { get; set; }

        /// <summary>
        /// Sağlayıcının müşteri kaydı (Stripe customer, IyziCo buyer vs.)
        /// </summary>
        public string? CustomerReference { get; set; }

        /// <summary>
        /// Tek seferlik veya kayıtlı ödeme yöntemi (Stripe payment_method, IyziCo card token vs.)
        /// </summary>
        public string? PaymentMethodReference { get; set; }

        /// <summary>
        /// Faturanın tercih ettiği sağlayıcı adı (örn. stripe, iyzico)
        /// </summary>
        public string? ProviderName { get; set; }
    }
}

