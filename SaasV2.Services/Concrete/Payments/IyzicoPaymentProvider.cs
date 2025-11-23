using System.Globalization;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Core.Payments;

namespace SaasV2.Services.Concrete.Payments
{
    public class IyzicoPaymentProvider : IPaymentProvider
    {
        private readonly HttpClient _httpClient;
        private readonly IyzicoOptions _options;
        private readonly ILogger<IyzicoPaymentProvider> _logger;

        private const string ProviderKey = "iyzico";

        public IyzicoPaymentProvider(
            HttpClient httpClient,
            IOptions<PaymentProviderOptions> options,
            ILogger<IyzicoPaymentProvider> logger)
        {
            _logger = logger;
            _httpClient = httpClient;
            _options = options.Value.Iyzico ?? new IyzicoOptions();

            if (!string.IsNullOrWhiteSpace(_options.BaseUrl))
            {
                _httpClient.BaseAddress = new Uri(_options.BaseUrl.TrimEnd('/') + "/");
            }
        }

        public async Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey) || string.IsNullOrWhiteSpace(_options.SecretKey))
            {
                _logger.LogError("IyziCo API credentials missing. Cannot charge invoice {InvoiceId}.", request.InvoiceId);
                throw new InvalidOperationException("IyziCo API credentials are not configured.");
            }

            if (request.Amount <= 0)
            {
                return PaymentResult.Failed("amount_invalid", "Tutar sıfırdan büyük olmalı.");
            }

            var (cardToken, cardUserKey) = ParsePaymentMethod(request);
            if (string.IsNullOrWhiteSpace(cardToken))
            {
                return PaymentResult.Failed("missing_card_token", "IyziCo ödeme işlemi için kart token bilgisi gerekli.");
            }

            var payload = BuildPayload(request, cardToken!, cardUserKey);
            var payloadJson = JsonSerializer.Serialize(payload, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull
            });

            var randomString = Guid.NewGuid().ToString("N");
            var signature = ComputeSignature(randomString, payloadJson);

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "payment/iyzipos/auth/ecom")
            {
                Content = new StringContent(payloadJson, Encoding.UTF8, "application/json")
            };

            httpRequest.Headers.Add("Authorization", $"IYZWS {_options.ApiKey}:{signature}");
            httpRequest.Headers.Add("x-iyzi-rnd", randomString);
            httpRequest.Headers.Add("x-iyzi-client-version", "saasv2-1.0.0");

            try
            {
                var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
                var content = await response.Content.ReadAsStringAsync(cancellationToken);

                using var document = JsonDocument.Parse(content);
                var root = document.RootElement;

                var status = root.TryGetProperty("status", out var statusElement)
                    ? statusElement.GetString()
                    : null;

                var paymentId = root.TryGetProperty("paymentId", out var paymentIdElement)
                    ? paymentIdElement.GetString()
                    : null;

                var paymentStatus = root.TryGetProperty("paymentStatus", out var paymentStatusElement)
                    ? paymentStatusElement.GetString()
                    : null;

                var metadata = BuildMetadata(paymentId, paymentStatus);

                if (!string.Equals(status, "success", StringComparison.OrdinalIgnoreCase))
                {
                    var errorCode = root.TryGetProperty("errorCode", out var errorCodeElement) ? errorCodeElement.GetString() : "iyzico_error";
                    var errorMessage = root.TryGetProperty("errorMessage", out var errorMessageElement) ? errorMessageElement.GetString() : "IyziCo ödeme reddedildi.";
                    _logger.LogWarning("IyziCo charge failed for invoice {InvoiceId}: {ErrorCode} - {ErrorMessage}", request.InvoiceId, errorCode, errorMessage);
                    return PaymentResult.Failed(errorCode, errorMessage, metadata);
                }

                if (string.Equals(paymentStatus, "SUCCESS", StringComparison.OrdinalIgnoreCase))
                {
                    return PaymentResult.Success(paymentId, metadata);
                }

                if (string.Equals(paymentStatus, "PENDING", StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(paymentStatus, "WAITING", StringComparison.OrdinalIgnoreCase))
                {
                    return PaymentResult.RequireAction(paymentId, metadata);
                }

                if (string.Equals(paymentStatus, "INIT_BANK_TRANSFER", StringComparison.OrdinalIgnoreCase))
                {
                    return new PaymentResult
                    {
                        Status = PaymentStatus.RequiresAction,
                        PaymentReference = paymentId,
                        RequiresAction = true,
                        Metadata = metadata,
                        ErrorMessage = "Bank transfer işlemi bekleniyor."
                    };
                }

                var fallbackMessage = root.TryGetProperty("errorMessage", out var fallbackMessageElement)
                    ? fallbackMessageElement.GetString()
                    : "IyziCo ödeme başarısız.";

                return PaymentResult.Failed("iyzico_payment_failed", fallbackMessage, metadata);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("IyziCo charge cancelled for invoice {InvoiceId}.", request.InvoiceId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "IyziCo charge encountered an unexpected exception for invoice {InvoiceId}.", request.InvoiceId);
                return PaymentResult.Failed("iyzico_exception", ex.Message);
            }
        }

        private (string? cardToken, string? cardUserKey) ParsePaymentMethod(PaymentRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.PaymentMethodReference))
            {
                return (null, null);
            }

            var parts = request.PaymentMethodReference.Split('|', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var token = parts.Length > 0 ? parts[0] : request.PaymentMethodReference;
            var userKey = parts.Length > 1 ? parts[1] : request.CustomerReference;
            return (token, userKey);
        }

        private object BuildPayload(PaymentRequest request, string cardToken, string? cardUserKey)
        {
            var price = request.Amount.ToString("0.00", CultureInfo.InvariantCulture);
            var description = string.IsNullOrWhiteSpace(request.Description) ? $"Invoice {request.InvoiceId}" : request.Description;
            var conversationId = $"{_options.ConversationPrefix ?? "saasv2"}-{request.InvoiceId:N}";
            var buyerEmail = request.Metadata != null && request.Metadata.TryGetValue("customer_email", out var emailVal)
                ? emailVal
                : "customer@example.com";

            var buyerName = request.Metadata != null && request.Metadata.TryGetValue("customer_name", out var nameVal)
                ? nameVal
                : "Saas Customer";

            var buyerSurname = request.Metadata != null && request.Metadata.TryGetValue("customer_surname", out var surnameVal)
                ? surnameVal
                : "Subscriber";

            var identityNumber = request.Metadata != null && request.Metadata.TryGetValue("identity_number", out var identityVal)
                ? identityVal
                : "11111111110";

            var city = request.Metadata != null && request.Metadata.TryGetValue("city", out var cityVal)
                ? cityVal
                : "Istanbul";

            var country = request.Metadata != null && request.Metadata.TryGetValue("country", out var countryVal)
                ? countryVal
                : "Turkey";

            var address = request.Metadata != null && request.Metadata.TryGetValue("address", out var addressVal)
                ? addressVal
                : "Billing Address";

            var ip = request.Metadata != null && request.Metadata.TryGetValue("ip", out var ipVal)
                ? ipVal
                : "127.0.0.1";

            var paymentCard = new Dictionary<string, object>
            {
                ["cardToken"] = cardToken,
                ["registerCard"] = 0
            };

            if (!string.IsNullOrWhiteSpace(cardUserKey))
            {
                paymentCard["cardUserKey"] = cardUserKey;
            }

            return new
            {
                locale = "tr",
                conversationId,
                price,
                paidPrice = price,
                currency = MapCurrency(request.Currency),
                installment = 1,
                paymentChannel = "WEB",
                paymentGroup = "SUBSCRIPTION",
                paymentSource = _options.PaymentSource ?? "SAASV2",
                callbackUrl = request.Metadata != null && request.Metadata.TryGetValue("callback_url", out var callbackUrl)
                    ? callbackUrl
                    : null,
                paymentCard,
                buyer = new
                {
                    id = request.UserId.ToString("N"),
                    name = buyerName,
                    surname = buyerSurname,
                    gsmNumber = request.Metadata != null && request.Metadata.TryGetValue("customer_phone", out var phoneVal) ? phoneVal : "+901234567890",
                    email = buyerEmail,
                    identityNumber,
                    registrationAddress = address,
                    ip,
                    city,
                    country
                },
                shippingAddress = new
                {
                    contactName = buyerName,
                    city,
                    country,
                    address
                },
                billingAddress = new
                {
                    contactName = buyerName,
                    city,
                    country,
                    address
                },
                basketItems = new[]
                {
                    new
                    {
                        id = request.InvoiceId.ToString("N"),
                        name = description,
                        category1 = "Subscription",
                        itemType = "VIRTUAL",
                        price
                    }
                }
            };
        }

        private string ComputeSignature(string randomString, string payloadJson)
        {
            var toSign = $"{_options.ApiKey}{randomString}{_options.SecretKey}{payloadJson}";
            using var sha1 = SHA1.Create();
            var hash = sha1.ComputeHash(Encoding.UTF8.GetBytes(toSign));
            return Convert.ToBase64String(hash);
        }

        private static IDictionary<string, string> BuildMetadata(string? paymentId, string? paymentStatus)
        {
            var metadata = new Dictionary<string, string>
            {
                ["provider"] = ProviderKey
            };

            if (!string.IsNullOrWhiteSpace(paymentId))
            {
                metadata["payment_id"] = paymentId;
            }

            if (!string.IsNullOrWhiteSpace(paymentStatus))
            {
                metadata["payment_status"] = paymentStatus!;
            }

            return metadata;
        }

        private static string MapCurrency(CurrencyCode currency) => currency switch
        {
            CurrencyCode.TRY => "TRY",
            CurrencyCode.USD => "USD",
            CurrencyCode.EUR => "EUR",
            CurrencyCode.GBP => "GBP",
            _ => "TRY"
        };
    }
}

