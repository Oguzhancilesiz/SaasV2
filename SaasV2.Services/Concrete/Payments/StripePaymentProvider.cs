using System.Globalization;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Core.Payments;

namespace SaasV2.Services.Concrete.Payments
{
    public class StripePaymentProvider : IPaymentProvider
    {
        private readonly HttpClient _httpClient;
        private readonly StripeOptions _options;
        private readonly ILogger<StripePaymentProvider> _logger;

        private const string ProviderKey = "stripe";

        public StripePaymentProvider(
            HttpClient httpClient,
            IOptions<PaymentProviderOptions> options,
            ILogger<StripePaymentProvider> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _options = options.Value.Stripe ?? new StripeOptions();
            if (_httpClient.BaseAddress == null)
            {
                _httpClient.BaseAddress = new Uri("https://api.stripe.com/");
            }
        }

        public async Task<PaymentResult> ChargeAsync(PaymentRequest request, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                _logger.LogError("Stripe API key is missing from configuration. Cannot process invoice {InvoiceId}.", request.InvoiceId);
                throw new InvalidOperationException("Stripe API key is not configured.");
            }

            if (request.Amount <= 0)
            {
                return PaymentResult.Failed("amount_invalid", "Amount must be greater than zero.");
            }

            if (string.IsNullOrWhiteSpace(request.PaymentMethodReference))
            {
                _logger.LogWarning("Stripe payment for invoice {InvoiceId} missing payment method reference.", request.InvoiceId);
                return PaymentResult.Failed("missing_payment_method", "Stripe ödeme işlemi için bir payment_method referansı gerekli.");
            }

            var payload = BuildPayload(request);
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, "v1/payment_intents")
            {
                Content = new FormUrlEncodedContent(payload)
            };

            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

            if (!string.IsNullOrWhiteSpace(_options.ApiVersion))
            {
                httpRequest.Headers.TryAddWithoutValidation("Stripe-Version", _options.ApiVersion);
            }

            try
            {
                var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
                var content = await response.Content.ReadAsStringAsync(cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    var (errorCode, errorMessage, errorMetadata) = ParseError(content);
                    _logger.LogWarning("Stripe charge failed for invoice {InvoiceId}: {ErrorCode} - {ErrorMessage}", request.InvoiceId, errorCode, errorMessage);
                    return PaymentResult.Failed(errorCode, errorMessage, errorMetadata);
                }

                using var document = JsonDocument.Parse(content);
                var root = document.RootElement;
                var status = root.GetProperty("status").GetString() ?? string.Empty;
                var paymentIntentId = root.GetProperty("id").GetString();
                var metadata = ExtractMetadata(root);

                _logger.LogDebug("Stripe payment intent {IntentId} returned status {Status} for invoice {InvoiceId}.", paymentIntentId, status, request.InvoiceId);

                return status switch
                {
                    "succeeded" => PaymentResult.Success(paymentIntentId, metadata),
                    "requires_action" => PaymentResult.RequireAction(paymentIntentId, metadata),
                    "requires_payment_method" => BuildFailureFromIntent(root, "requires_payment_method", metadata),
                    "requires_confirmation" => PaymentResult.RequireAction(paymentIntentId, metadata),
                    "processing" => new PaymentResult
                    {
                        Status = PaymentStatus.Processing,
                        PaymentReference = paymentIntentId,
                        Metadata = metadata
                    },
                    "canceled" => new PaymentResult
                    {
                        Status = PaymentStatus.Canceled,
                        PaymentReference = paymentIntentId,
                        ErrorCode = "canceled",
                        ErrorMessage = GetLastPaymentError(root) ?? "Ödeme sağlayıcı tarafından iptal edildi.",
                        Metadata = metadata
                    },
                    _ => BuildFailureFromIntent(root, status, metadata)
                };
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Stripe charge cancelled for invoice {InvoiceId}.", request.InvoiceId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Stripe charge encountered an unexpected exception for invoice {InvoiceId}.", request.InvoiceId);
                return PaymentResult.Failed("stripe_exception", ex.Message);
            }
        }

        private static PaymentResult BuildFailureFromIntent(JsonElement intent, string status, IDictionary<string, string>? metadata)
        {
            var errorMessage = GetLastPaymentError(intent) ?? $"Stripe intent status: {status}";
            var errorCode = intent.TryGetProperty("last_payment_error", out var lastError) && lastError.TryGetProperty("code", out var codeElement)
                ? codeElement.GetString()
                : status;

            return PaymentResult.Failed(errorCode, errorMessage, metadata);
        }

        private static List<KeyValuePair<string, string>> BuildPayload(PaymentRequest request)
        {
            var amountMinor = ConvertToMinorUnits(request.Amount, request.Currency);
            var currency = MapCurrency(request.Currency);
            var payload = new List<KeyValuePair<string, string>>
            {
                new("amount", amountMinor.ToString(CultureInfo.InvariantCulture)),
                new("currency", currency),
                new("confirm", "true"),
                new("off_session", "true"),
                new("payment_method", request.PaymentMethodReference!),
                new("description", request.Description ?? $"Invoice {request.InvoiceId}")
            };

            payload.Add(new KeyValuePair<string, string>("payment_method_options[card][request_three_d_secure]", "automatic"));

            if (!string.IsNullOrWhiteSpace(request.CustomerReference))
            {
                payload.Add(new KeyValuePair<string, string>("customer", request.CustomerReference));
            }

            if (request.Metadata != null)
            {
                foreach (var kvp in request.Metadata)
                {
                    if (string.IsNullOrWhiteSpace(kvp.Key) || kvp.Value is null)
                    {
                        continue;
                    }

                    payload.Add(new KeyValuePair<string, string>($"metadata[{kvp.Key}]", kvp.Value));
                }
            }

            return payload;
        }

        private static string MapCurrency(CurrencyCode currency) => currency switch
        {
            CurrencyCode.TRY => "try",
            CurrencyCode.USD => "usd",
            CurrencyCode.EUR => "eur",
            CurrencyCode.GBP => "gbp",
            _ => "usd"
        };

        private static long ConvertToMinorUnits(decimal amount, CurrencyCode currency) =>
            (long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero);

        private static IDictionary<string, string> ExtractMetadata(JsonElement root)
        {
            var metadata = new Dictionary<string, string>
            {
                ["provider"] = ProviderKey
            };

            if (root.TryGetProperty("id", out var idElement) && idElement.ValueKind == JsonValueKind.String)
            {
                metadata["payment_intent_id"] = idElement.GetString()!;
            }

            if (root.TryGetProperty("status", out var statusElement) && statusElement.ValueKind == JsonValueKind.String)
            {
                metadata["status"] = statusElement.GetString()!;
            }

            if (root.TryGetProperty("client_secret", out var clientSecret) && clientSecret.ValueKind == JsonValueKind.String)
            {
                metadata["client_secret"] = clientSecret.GetString()!;
            }

            if (root.TryGetProperty("metadata", out var metaElement) && metaElement.ValueKind == JsonValueKind.Object)
            {
                foreach (var property in metaElement.EnumerateObject())
                {
                    if (property.Value.ValueKind == JsonValueKind.String)
                    {
                        metadata[$"intent_metadata_{property.Name}"] = property.Value.GetString()!;
                    }
                }
            }

            return metadata;
        }

        private static (string errorCode, string errorMessage, IDictionary<string, string>? metadata) ParseError(string content)
        {
            try
            {
                using var document = JsonDocument.Parse(content);
                var root = document.RootElement;
                if (!root.TryGetProperty("error", out var errorElement))
                {
                    return ("stripe_error", content, new Dictionary<string, string> { ["provider"] = ProviderKey });
                }

                var code = errorElement.TryGetProperty("code", out var codeElement) ? codeElement.GetString() : "stripe_error";
                var message = errorElement.TryGetProperty("message", out var messageElement) ? messageElement.GetString() : "Stripe error";

                var metadata = new Dictionary<string, string> { ["provider"] = ProviderKey };

                if (errorElement.TryGetProperty("type", out var typeElement))
                {
                    metadata["type"] = typeElement.GetString() ?? string.Empty;
                }

                return (code ?? "stripe_error", message ?? "Stripe error", metadata);
            }
            catch
            {
                return ("stripe_error", content, new Dictionary<string, string> { ["provider"] = ProviderKey });
            }
        }

        private static string? GetLastPaymentError(JsonElement intent)
        {
            if (intent.TryGetProperty("last_payment_error", out var lastError) && lastError.ValueKind == JsonValueKind.Object)
            {
                if (lastError.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String)
                {
                    return messageElement.GetString();
                }
            }

            if (intent.TryGetProperty("charges", out var charges) &&
                charges.TryGetProperty("data", out var data) &&
                data.ValueKind == JsonValueKind.Array &&
                data.GetArrayLength() > 0)
            {
                var charge = data[0];
                if (charge.TryGetProperty("failure_message", out var failureMessage) && failureMessage.ValueKind == JsonValueKind.String)
                {
                    return failureMessage.GetString();
                }
            }

            return null;
        }
    }
}

