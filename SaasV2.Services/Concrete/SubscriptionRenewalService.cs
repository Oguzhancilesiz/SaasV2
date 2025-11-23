using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System.Text.Json;
using SaasV2.DAL;
using System.Collections.Generic;
using SaasV2.DTOs.InvoiceDTOs;

namespace SaasV2.Services.Concrete
{
    public class SubscriptionRenewalService : ISubscriptionRenewalService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Subscription> _subscriptionRepo;
        private readonly IBaseRepository<Plan> _planRepo;
        private readonly IBaseRepository<PlanPrice> _planPriceRepo;
        private readonly IBaseRepository<Invoice> _invoiceRepo;
        private readonly IBaseRepository<InvoiceLine> _invoiceLineRepo;
        private readonly IBaseRepository<SubscriptionChangeLog> _changeLogRepo;
        private readonly IPaymentWorkflowService _paymentWorkflowService;
        private readonly ILogger<SubscriptionRenewalService> _logger;

        public SubscriptionRenewalService(
            IUnitOfWork uow,
            ILogger<SubscriptionRenewalService> logger,
            IPaymentWorkflowService paymentWorkflowService)
        {
            _uow = uow;
            _logger = logger;
            _subscriptionRepo = _uow.Repository<Subscription>();
            _planRepo = _uow.Repository<Plan>();
            _planPriceRepo = _uow.Repository<PlanPrice>();
            _invoiceRepo = _uow.Repository<Invoice>();
            _invoiceLineRepo = _uow.Repository<InvoiceLine>();
            _changeLogRepo = _uow.Repository<SubscriptionChangeLog>();
            _paymentWorkflowService = paymentWorkflowService;
        }

        public async Task<int> ProcessDueRenewalsAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var dueQuery = await _subscriptionRepo.GetBy(x =>
                x.Status != Status.Deleted &&
                x.RenewalPolicy == RenewalPolicy.Auto &&
                x.RenewAt != null &&
                x.RenewAt <= now);

            var dueSubscriptions = await dueQuery
                .OrderBy(x => x.RenewAt)
                .Take(100) // safeguard
                .ToListAsync(cancellationToken);

            if (dueSubscriptions.Count == 0)
            {
                return 0;
            }

            var processed = 0;
            foreach (var subscription in dueSubscriptions)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    break;
                }

                try
                {
                    var plan = await _planRepo.GetById(subscription.PlanId, ignoreQueryFilter: true)
                               ?? throw new InvalidOperationException($"Plan {subscription.PlanId} not found for subscription {subscription.Id}.");

                    if (plan.BillingPeriod == BillingPeriod.OneTime)
                    {
                        subscription.RenewalPolicy = RenewalPolicy.None;
                        subscription.RenewAt = null;
                        subscription.ModifiedDate = now;
                        await _subscriptionRepo.Update(subscription);
                        await _uow.SaveChangesAsync();
                        _logger.LogInformation("Subscription {SubscriptionId} set to manual as billing period is OneTime.", subscription.Id);
                        continue;
                    }

                    var previousAmount = subscription.UnitPrice;
                    var price = await GetCurrentPlanPriceAsync(subscription.PlanId, cancellationToken);
                    if (price is not null)
                    {
                        subscription.PlanPriceId = price.Id;
                        subscription.UnitPrice = price.Amount;
                        subscription.Currency = price.Currency;
                    }

                    var periodStart = subscription.CurrentPeriodEnd;
                    var periodEnd = CalcNextRenewal(subscription.CurrentPeriodEnd, plan.BillingPeriod);
                    var amount = subscription.UnitPrice;
                    var currency = subscription.Currency;

                    var context = _uow.Context as BaseContext;
                    if (context is null)
                    {
                        throw new InvalidOperationException("BaseContext is required for transactional operations.");
                    }

                    await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);

                    Invoice? invoice = null;
                    InvoiceDTO? paymentResultDto = null;
                    if (amount > 0)
                    {
                        invoice = new Invoice
                        {
                            Id = Guid.NewGuid(),
                            Status = Status.Active,
                            CreatedDate = now,
                            ModifiedDate = now,
                            AppId = subscription.AppId,
                            UserId = subscription.UserId,
                            PeriodStart = periodStart,
                            PeriodEnd = periodEnd,
                            Currency = currency,
                            Subtotal = amount,
                            Tax = 0m,
                            Total = amount,
                            PaymentReference = subscription.ExternalPaymentRef,
                            PaymentStatus = PaymentStatus.Pending,
                            PaymentProvider = null,
                            DueDate = periodEnd,
                            RequiresAction = false,
                            PaymentAttemptCount = 0,
                            LastAttemptAt = null,
                            NextRetryAt = null
                        };

                        await _invoiceRepo.AddAsync(invoice);

                        var line = new InvoiceLine
                        {
                            Id = Guid.NewGuid(),
                            Status = Status.Active,
                            CreatedDate = now,
                            ModifiedDate = now,
                            InvoiceId = invoice.Id,
                            Description = $"Plan {plan.Name} ({plan.Code}) {periodStart:yyyy-MM-dd} - {periodEnd:yyyy-MM-dd}",
                            PlanId = subscription.PlanId,
                            FeatureId = null,
                            Quantity = 1m,
                            UnitPrice = amount,
                            Amount = amount
                        };

                        await _invoiceLineRepo.AddAsync(line);
                    }

                    var oldAmount = previousAmount;

                    subscription.CurrentPeriodStart = periodStart;
                    subscription.CurrentPeriodEnd = periodEnd;
                    subscription.RenewAt = periodEnd;
                    subscription.LastInvoicedAt = now;
                    subscription.LastInvoiceId = invoice?.Id;
                    subscription.RenewalAttemptCount = 0;
                    subscription.ModifiedDate = now;

                    await _subscriptionRepo.Update(subscription);

                    var changeMetadata = new Dictionary<string, object?>
                    {
                        ["periodStart"] = periodStart,
                        ["periodEnd"] = periodEnd,
                        ["amount"] = amount,
                        ["currency"] = currency
                    };

                    var changeLog = new SubscriptionChangeLog
                    {
                        Id = Guid.NewGuid(),
                        Status = Status.Active,
                        CreatedDate = now,
                        ModifiedDate = now,
                        SubscriptionId = subscription.Id,
                        AppId = subscription.AppId,
                        UserId = subscription.UserId,
                        ChangeType = SubscriptionChangeType.Renewed,
                        OldPlanId = subscription.PlanId,
                        NewPlanId = subscription.PlanId,
                        InvoiceId = invoice?.Id,
                        TriggeredByUserId = null,
                        EffectiveDate = now,
                        OldAmount = oldAmount,
                        NewAmount = amount,
                        Currency = currency,
                        Reason = "Automatic renewal",
                        Metadata = JsonSerializer.Serialize(changeMetadata)
                    };

                    await _changeLogRepo.AddAsync(changeLog);

                    await _uow.SaveChangesAsync();

                    if (invoice is not null)
                    {
                        try
                        {
                            paymentResultDto = await _paymentWorkflowService.ProcessInvoiceAsync(invoice.Id, cancellationToken);
                            changeMetadata["paymentStatus"] = paymentResultDto.PaymentStatus;
                            changeMetadata["paymentReference"] = paymentResultDto.PaymentReference;
                            changeMetadata["paymentProvider"] = paymentResultDto.PaymentProvider;
                            changeMetadata["paymentRequiresAction"] = paymentResultDto.RequiresAction;
                            changeMetadata["paymentAttemptCount"] = paymentResultDto.PaymentAttemptCount;

                            changeLog.Metadata = JsonSerializer.Serialize(changeMetadata);
                            await _changeLogRepo.Update(changeLog);
                            await _uow.SaveChangesAsync();
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Automatic payment workflow failed for invoice {InvoiceId}", invoice.Id);
                        }
                    }

                    await transaction.CommitAsync(cancellationToken);

                    processed++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Automatic renewal failed for subscription {SubscriptionId}", subscription.Id);

                    subscription.RenewalAttemptCount += 1;
                    subscription.ModifiedDate = now;
                    await _subscriptionRepo.Update(subscription);
                    await _uow.SaveChangesAsync();
                }
            }

            return processed;
        }

        private async Task<PlanPrice?> GetCurrentPlanPriceAsync(Guid planId, CancellationToken cancellationToken)
        {
            var currentQuery = await _planPriceRepo.GetBy(x =>
                x.PlanId == planId &&
                x.Status != Status.Deleted &&
                x.IsCurrent);

            var current = await currentQuery
                .OrderByDescending(x => x.EffectiveFrom)
                .FirstOrDefaultAsync(cancellationToken);

            if (current is not null)
            {
                return current;
            }

            var fallbackQuery = await _planPriceRepo.GetBy(x =>
                x.PlanId == planId &&
                x.Status != Status.Deleted &&
                x.EffectiveFrom <= DateTime.UtcNow);

            return await fallbackQuery
                .OrderByDescending(x => x.EffectiveFrom)
                .FirstOrDefaultAsync(cancellationToken);
        }

        private static DateTime CalcNextRenewal(DateTime from, BillingPeriod period)
        {
            return period switch
            {
                BillingPeriod.Monthly => from.AddMonths(1),
                BillingPeriod.Yearly => from.AddYears(1),
                BillingPeriod.Weekly => from.AddDays(7),
                BillingPeriod.Daily => from.AddDays(1),
                _ => from.AddMonths(1)
            };
        }
    }
}

