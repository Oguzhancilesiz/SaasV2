using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Core.Payments;
using SaasV2.DTOs.InvoiceDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using SaasV2.Services.Concrete.Payments;
using System.Collections.Generic;

namespace SaasV2.Services.Concrete
{
    public class PaymentWorkflowService : IPaymentWorkflowService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Invoice> _invoiceRepo;
        private readonly IBaseRepository<InvoicePaymentAttempt> _attemptRepo;
        private readonly IBaseRepository<Subscription> _subscriptionRepo;
        private readonly IPaymentProvider _paymentProvider;
        private readonly ILogger<PaymentWorkflowService> _logger;
        private readonly PaymentProviderOptions _paymentOptions;

        public PaymentWorkflowService(
            IUnitOfWork uow,
            IPaymentProvider paymentProvider,
            IOptions<PaymentProviderOptions> paymentOptions,
            ILogger<PaymentWorkflowService> logger)
        {
            _uow = uow;
            _paymentProvider = paymentProvider;
            _logger = logger;
            _invoiceRepo = _uow.Repository<Invoice>();
            _attemptRepo = _uow.Repository<InvoicePaymentAttempt>();
            _subscriptionRepo = _uow.Repository<Subscription>();
            _paymentOptions = paymentOptions.Value;
        }

        public async Task<InvoiceDTO> ProcessInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken = default)
        {
            var invoice = await LoadInvoiceAsync(invoiceId);

            if (invoice.PaymentStatus == PaymentStatus.Succeeded)
            {
                _logger.LogInformation("Invoice {InvoiceId} is already paid.", invoiceId);
                return invoice.Adapt<InvoiceDTO>();
            }

            return await ProcessInvoiceInternalAsync(invoice, isManualRetry: false, force: false, cancellationToken);
        }

        public async Task<InvoiceDTO> RetryInvoiceAsync(Guid invoiceId, bool force = false, CancellationToken cancellationToken = default)
        {
            var invoice = await LoadInvoiceAsync(invoiceId);

            if (!force && invoice.PaymentStatus == PaymentStatus.Succeeded)
            {
                throw new InvalidOperationException("Ödenmiş faturada manuel yeniden deneme yapılamaz.");
            }

            if (!force && invoice.PaymentStatus == PaymentStatus.Canceled)
            {
                throw new InvalidOperationException("İptal edilmiş faturada yeniden deneme yapılamaz.");
            }

            return await ProcessInvoiceInternalAsync(invoice, isManualRetry: true, force, cancellationToken);
        }

        public async Task<InvoiceDTO> CancelInvoiceAsync(Guid invoiceId, string? reason = null, CancellationToken cancellationToken = default)
        {
            var invoice = await LoadInvoiceAsync(invoiceId);

            if (invoice.PaymentStatus == PaymentStatus.Succeeded)
            {
                throw new InvalidOperationException("Ödenmiş fatura iptal edilemez.");
            }

            if (invoice.PaymentStatus == PaymentStatus.Canceled)
            {
                _logger.LogInformation("Invoice {InvoiceId} already canceled.", invoiceId);
                return invoice.Adapt<InvoiceDTO>();
            }

            var providerName = ResolveProviderName(invoice);
            invoice.PaymentProvider = providerName;

            invoice.PaymentStatus = PaymentStatus.Canceled;
            invoice.RequiresAction = false;
            invoice.NextRetryAt = null;
            invoice.LastAttemptAt = DateTime.UtcNow;
            invoice.FailedAt ??= DateTime.UtcNow;
            invoice.LastErrorCode = "manual_cancel";
            invoice.LastErrorMessage = string.IsNullOrWhiteSpace(reason)
                ? "Admin panelinden manuel iptal edildi."
                : reason!.Trim();
            invoice.ModifiedDate = DateTime.UtcNow;

            await _invoiceRepo.Update(invoice);

            await RecordAttemptAsync(invoice, new PaymentResult
            {
                Status = PaymentStatus.Canceled,
                PaymentReference = invoice.PaymentReference,
                ErrorCode = "manual_cancel",
                ErrorMessage = invoice.LastErrorMessage,
                Metadata = new Dictionary<string, string>
                {
                    ["manual_action"] = "cancel"
                }
            }, providerName, DateTime.UtcNow);

            await _uow.SaveChangesAsync();

            return invoice.Adapt<InvoiceDTO>();
        }

        public async Task<List<InvoicePaymentAttemptDTO>> GetAttemptsAsync(Guid invoiceId)
        {
            var query = await _attemptRepo.GetBy(x => x.InvoiceId == invoiceId && x.Status != Status.Deleted);
            return await query.AsNoTracking()
                              .OrderByDescending(x => x.AttemptedAt)
                              .ProjectToType<InvoicePaymentAttemptDTO>()
                              .ToListAsync();
        }

        private async Task<InvoiceDTO> ProcessInvoiceInternalAsync(Invoice invoice, bool isManualRetry, bool force, CancellationToken cancellationToken)
        {
            var providerName = ResolveProviderName(invoice);
            invoice.PaymentProvider = providerName;

            invoice.PaymentStatus = PaymentStatus.Processing;
            invoice.ModifiedDate = DateTime.UtcNow;

            await _invoiceRepo.Update(invoice);
            await _uow.SaveChangesAsync();

            var (customerReference, paymentMethodReference) = await ResolvePaymentReferencesAsync(invoice, cancellationToken);
            var metadata = BuildPaymentMetadata(invoice, providerName, customerReference, paymentMethodReference, isManualRetry, force);

            var paymentRequest = new PaymentRequest
            {
                InvoiceId = invoice.Id,
                AppId = invoice.AppId,
                UserId = invoice.UserId,
                Amount = invoice.Total,
                Currency = invoice.Currency,
                Description = $"Invoice {invoice.Id}",
                Metadata = metadata,
                CustomerReference = customerReference,
                PaymentMethodReference = paymentMethodReference,
                ProviderName = providerName
            };

            var result = await _paymentProvider.ChargeAsync(paymentRequest, cancellationToken);

            await RecordAttemptAsync(invoice, result, providerName, DateTime.UtcNow);

            invoice.PaymentStatus = result.Status;
            invoice.RequiresAction = result.RequiresAction;
            invoice.LastAttemptAt = DateTime.UtcNow;
            invoice.PaymentAttemptCount += 1;

            switch (result.Status)
            {
                case PaymentStatus.Succeeded:
                    invoice.PaymentReference = result.PaymentReference ?? invoice.PaymentReference;
                    invoice.PaidAt = DateTime.UtcNow;
                    invoice.FailedAt = null;
                    invoice.LastErrorCode = null;
                    invoice.LastErrorMessage = null;
                    invoice.NextRetryAt = null;
                    break;

                case PaymentStatus.RequiresAction:
                    invoice.PaymentReference = result.PaymentReference ?? invoice.PaymentReference;
                    invoice.PaidAt = null;
                    invoice.FailedAt = null;
                    invoice.NextRetryAt = null;
                    break;

                case PaymentStatus.Failed:
                    invoice.FailedAt = DateTime.UtcNow;
                    invoice.LastErrorCode = result.ErrorCode ?? invoice.LastErrorCode;
                    invoice.LastErrorMessage = result.ErrorMessage ?? invoice.LastErrorMessage;
                    invoice.NextRetryAt = ComputeNextRetry(invoice.PaymentAttemptCount);
                    break;

                case PaymentStatus.Canceled:
                    invoice.NextRetryAt = null;
                    invoice.RequiresAction = false;
                    break;
            }

            invoice.ModifiedDate = DateTime.UtcNow;

            await _invoiceRepo.Update(invoice);
            await _uow.SaveChangesAsync();

            return invoice.Adapt<InvoiceDTO>();
        }

        private async Task<Invoice> LoadInvoiceAsync(Guid invoiceId)
        {
            return await _invoiceRepo.GetById(invoiceId, ignoreQueryFilter: true)
                ?? throw new KeyNotFoundException($"Invoice {invoiceId} bulunamadı.");
        }

        private string ResolveProviderName(Invoice invoice)
        {
            foreach (var candidate in new[] { invoice.PaymentProvider, _paymentOptions.Provider, "stripe" })
            {
                if (string.IsNullOrWhiteSpace(candidate))
                {
                    continue;
                }

                var normalized = candidate.Trim().ToLowerInvariant();
                if (IsSupportedProvider(normalized))
                {
                    return normalized;
                }
            }

            return "stripe";
        }

        private static bool IsSupportedProvider(string provider)
            => provider is "stripe" or "iyzico" or "mock";

        private async Task<(string? customerReference, string? paymentMethodReference)> ResolvePaymentReferencesAsync(Invoice invoice, CancellationToken cancellationToken)
        {
            string? paymentMethodReference = Normalize(invoice.PaymentReference);
            string? customerReference = null;

            if (string.IsNullOrWhiteSpace(paymentMethodReference))
            {
                var subscriptionQuery = await _subscriptionRepo.GetBy(x =>
                    x.AppId == invoice.AppId &&
                    x.UserId == invoice.UserId &&
                    x.Status != Status.Deleted);

                var subscription = await subscriptionQuery
                    .OrderByDescending(x => x.CurrentPeriodEnd)
                    .FirstOrDefaultAsync(cancellationToken);

                if (subscription != null)
                {
                    paymentMethodReference = Normalize(subscription.ExternalPaymentRef);
                }
            }

            return (customerReference, paymentMethodReference);
        }

        private static Dictionary<string, string> BuildPaymentMetadata(
            Invoice invoice,
            string providerName,
            string? customerReference,
            string? paymentMethodReference,
            bool isManualRetry,
            bool force)
        {
            var metadata = new Dictionary<string, string>
            {
                ["invoice_id"] = invoice.Id.ToString("D"),
                ["invoice_auto_id"] = invoice.AutoID.ToString(),
                ["period_start"] = invoice.PeriodStart.ToString("O"),
                ["period_end"] = invoice.PeriodEnd.ToString("O"),
                ["app_id"] = invoice.AppId.ToString("D"),
                ["user_id"] = invoice.UserId.ToString("D"),
                ["provider"] = providerName,
                ["manual_retry"] = isManualRetry ? "true" : "false",
                ["manual_force"] = force ? "true" : "false"
            };

            if (!string.IsNullOrWhiteSpace(invoice.PaymentReference))
            {
                metadata["invoice_payment_reference"] = invoice.PaymentReference;
            }

            if (!string.IsNullOrWhiteSpace(customerReference))
            {
                metadata["customer_reference"] = customerReference!;
            }

            if (!string.IsNullOrWhiteSpace(paymentMethodReference))
            {
                metadata["payment_method_reference"] = paymentMethodReference!;
            }

            return metadata;
        }

        private async Task RecordAttemptAsync(Invoice invoice, PaymentResult result, string providerName, DateTime? attemptedAt = null)
        {
            var timestamp = attemptedAt ?? DateTime.UtcNow;

            var attempt = new InvoicePaymentAttempt
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                AttemptedAt = timestamp,
                Amount = invoice.Total,
                Currency = invoice.Currency,
                ResultStatus = result.Status,
                PaymentProvider = providerName,
                ProviderReference = result.PaymentReference,
                ProviderResponseCode = result.ErrorCode,
                ProviderResponseMessage = result.ErrorMessage,
                RequiresAction = result.RequiresAction,
                Status = Status.Active,
                CreatedDate = timestamp,
                ModifiedDate = timestamp
            };

            await _attemptRepo.AddAsync(attempt);
        }

        private static DateTime? ComputeNextRetry(int attemptCount)
        {
            const int maxAttempts = 5;

            if (attemptCount >= maxAttempts)
            {
                return null;
            }

            var delay = TimeSpan.FromMinutes(Math.Pow(2, attemptCount)); // exponential backoff
            return DateTime.UtcNow.Add(delay);
        }

        private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}

