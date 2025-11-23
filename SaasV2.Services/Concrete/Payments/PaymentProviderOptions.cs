using System;

namespace SaasV2.Services.Concrete.Payments
{
    public class PaymentProviderOptions
    {
        /// <summary>
        /// Varsayılan sağlayıcı (stripe, iyzico, mock)
        /// </summary>
        public string Provider { get; set; } = "stripe";

        public StripeOptions Stripe { get; set; } = new();

        public IyzicoOptions Iyzico { get; set; } = new();
    }

    public class StripeOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string? ApiVersion { get; set; }
    }

    public class IyzicoOptions
    {
        public string ApiKey { get; set; } = string.Empty;
        public string SecretKey { get; set; } = string.Empty;
        public string BaseUrl { get; set; } = "https://sandbox-api.iyzipay.com";
        public string? ConversationPrefix { get; set; } = "saasv2";
        public string? PaymentSource { get; set; }
    }
}

