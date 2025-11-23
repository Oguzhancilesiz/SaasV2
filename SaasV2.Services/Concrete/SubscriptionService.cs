// SubscriptionService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.SubscriptionDTOs;
using SaasV2.DTOs.SubscriptionItemDTOs;
using SaasV2.DTOs.InvoiceDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Subscription> _subRepo;
        private readonly IBaseRepository<SubscriptionItem> _itemRepo;
        private readonly IBaseRepository<Plan> _planRepo;
        private readonly IBaseRepository<PlanFeature> _pfRepo;
        private readonly IBaseRepository<PlanPrice> _priceRepo;
        private readonly IBaseRepository<SubscriptionChangeLog> _changeRepo;
        private readonly IInvoiceService _invoiceService;

        public SubscriptionService(IUnitOfWork uow, IInvoiceService invoiceService)
        {
            _uow = uow;
            _subRepo = _uow.Repository<Subscription>();
            _itemRepo = _uow.Repository<SubscriptionItem>();
            _planRepo = _uow.Repository<Plan>();
            _pfRepo = _uow.Repository<PlanFeature>();
            _priceRepo = _uow.Repository<PlanPrice>();
            _changeRepo = _uow.Repository<SubscriptionChangeLog>();
            _invoiceService = invoiceService;
        }

        #region IBaseService
        public async Task Add(SubscriptionAddDTO dto)
        {
            // Çoğu senaryoda StartAsync kullan; ama gene de aynı davranışı uygulayalım
            _ = await StartAsync(dto);
        }

        public async Task Update(SubscriptionUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");
            var entity = await _subRepo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Subscription bulunamadı.");

            // Plan değişimini Update ile değil ChangePlanAsync ile yapıyoruz
            if (dto.PlanId != Guid.Empty && dto.PlanId != entity.PlanId)
                throw new InvalidOperationException("Plan değişimi için ChangePlanAsync kullanın.");

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _subRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _subRepo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Subscription bulunamadı.");

            // Soft delete + EndAt
            entity.Status = Status.Deleted;
            entity.EndAt = entity.EndAt ?? DateTime.UtcNow;
            entity.ModifiedDate = DateTime.UtcNow;

            await _subRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<SubscriptionDTO>> GetAll()
        {
            var q = await _subRepo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.CreatedDate)
                          .ProjectToType<SubscriptionDTO>()
                          .ToListAsync();
        }

        public async Task<SubscriptionDTO> GetById(Guid id)
        {
            var entity = await _subRepo.GetById(id)
                         ?? throw new KeyNotFoundException("Subscription bulunamadı.");
            return entity.Adapt<SubscriptionDTO>();
        }
        #endregion

        #region İş Akışları
        public async Task<SubscriptionDTO> StartAsync(SubscriptionAddDTO dto, Guid? triggeredByUserId = null, string? reason = null)
        {
            if (dto.AppId == Guid.Empty || dto.UserId == Guid.Empty || dto.PlanId == Guid.Empty)
                throw new ArgumentException("AppId, UserId, PlanId zorunlu.");

            // Tek aktif abonelik: aynı App + User için aktif varsa kapat
            var existingActive = await GetActiveAsync(dto.AppId, dto.UserId);
            if (existingActive is not null)
            {
                var autoCancelReason = reason ?? "Yeni abonelik başlatıldığı için mevcut abonelik sonlandırıldı.";
                await CancelAsync(existingActive.Id, endAt: dto.StartAt == default ? DateTime.UtcNow : dto.StartAt, triggeredByUserId, autoCancelReason);
            }

            var plan = await _planRepo.GetById(dto.PlanId)
                       ?? throw new KeyNotFoundException("Plan bulunamadı.");

            var now = DateTime.UtcNow;
            var startAt = dto.StartAt == default ? now : dto.StartAt;

            // Trial varsa yenileme başlangıcı trial sonrası olsun
            DateTime? renewAt = dto.RenewAt;
            if (plan.TrialDays > 0 && renewAt is null)
            {
                renewAt = startAt.Date.AddDays(plan.TrialDays);
            }
            else if (renewAt is null)
            {
                renewAt = CalcNextRenewal(startAt, plan.BillingPeriod);
            }

            var currentPrice = await GetCurrentPlanPriceAsync(dto.PlanId);
            var currency = currentPrice?.Currency ?? CurrencyCode.TRY;
            var unitPrice = currentPrice?.Amount ?? 0m;
            var planPriceId = currentPrice?.Id;

            var sub = dto.Adapt<Subscription>();
            sub.Id = Guid.NewGuid();
            sub.Status = Status.Active;
            sub.CreatedDate = now;
            sub.ModifiedDate = now;
            sub.StartAt = startAt;
            var periodEnd = renewAt ?? CalcNextRenewal(startAt, plan.BillingPeriod);
            sub.CurrentPeriodStart = startAt;
            sub.CurrentPeriodEnd = periodEnd;
            sub.RenewAt = periodEnd;
            sub.TrialEndsAt = plan.TrialDays > 0 ? startAt.Date.AddDays(plan.TrialDays) : null;
            sub.PlanPriceId = planPriceId;
            sub.Currency = currency;
            sub.UnitPrice = unitPrice;
            sub.RenewalAttemptCount = 0;
            sub.LastInvoicedAt = null;
            sub.LastInvoiceId = null;
            sub.CancellationReason = null;

            await _subRepo.AddAsync(sub);
            await _uow.SaveChangesAsync();

            // SubscriptionItem'ları PlanFeature'lardan kur
            await SeedSubscriptionItemsFromPlan(sub.Id, sub.PlanId, startAt);

            await LogChangeAsync(SubscriptionChangeType.Created, sub, null, sub.PlanId, null, unitPrice, currency, triggeredByUserId, reason);

            // Free plan kontrolü ve fatura oluşturma
            System.Diagnostics.Debug.WriteLine($"🔍 Fatura kontrolü - Plan: {plan.Name}, IsFree: {plan.IsFree}, UnitPrice: {unitPrice}, Currency: {currency}");
            
            if (!plan.IsFree)
            {
                // Free plan değilse mutlaka fatura oluştur (fiyat 0 olsa bile)
                try
                {
                    // Subscription'ı tekrar çek (tracking için)
                    var savedSub = await _subRepo.GetById(sub.Id, ignoreQueryFilter: true);
                    if (savedSub != null)
                    {
                        System.Diagnostics.Debug.WriteLine($"📝 Fatura oluşturma başlatılıyor - SubscriptionId: {savedSub.Id}");
                        var invoiceId = await CreateInvoiceForSubscriptionAsync(savedSub, plan, unitPrice, currency, startAt, periodEnd);
                        if (invoiceId.HasValue)
                        {
                            System.Diagnostics.Debug.WriteLine($"✅ Fatura başarıyla oluşturuldu - InvoiceId: {invoiceId.Value}, SubscriptionId: {savedSub.Id}");
                        }
                        else
                        {
                            System.Diagnostics.Debug.WriteLine($"⚠️ Fatura oluşturulamadı (null döndü) - SubscriptionId: {savedSub.Id}");
                        }
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine($"⚠️ Subscription bulunamadı - SubscriptionId: {sub.Id}");
                    }
                }
                catch (Exception ex)
                {
                    // Fatura oluşturma hatası - log'la ama abonelik oluşturmayı engelleme
                    System.Diagnostics.Debug.WriteLine($"❌ Fatura oluşturma hatası: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        System.Diagnostics.Debug.WriteLine($"   Inner Exception: {ex.InnerException.Message}");
                    }
                    System.Diagnostics.Debug.WriteLine($"Stack Trace: {ex.StackTrace}");
                }
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"ℹ️ Free plan - Fatura oluşturulmayacak - Plan: {plan.Name}");
            }

            return sub.Adapt<SubscriptionDTO>();
        }

        public async Task<SubscriptionDTO> ChangePlanAsync(Guid subscriptionId, Guid newPlanId, Guid? triggeredByUserId = null, string? reason = null)
        {
            if (subscriptionId == Guid.Empty || newPlanId == Guid.Empty)
                throw new ArgumentException("subscriptionId ve newPlanId zorunlu.");

            var sub = await _subRepo.GetById(subscriptionId, ignoreQueryFilter: true)
                      ?? throw new KeyNotFoundException("Subscription bulunamadı.");
            if (sub.Status == Status.Deleted) throw new InvalidOperationException("Silinmiş abonelik değiştirilemez.");

            var now = DateTime.UtcNow;
            var oldPlanId = sub.PlanId;
            var oldAmount = sub.UnitPrice;
            var oldCurrency = sub.Currency;

            // Eskiyi kapat
            sub.Status = Status.Deleted;
            sub.EndAt = now;
            sub.ModifiedDate = now;
            sub.CancellationReason = reason ?? "Plan değişikliği";
            await _subRepo.Update(sub);

            // Yeni planı başlat (yenileme politikasını koruyup start now)
            var newDto = new SubscriptionAddDTO
            {
                AppId = sub.AppId,
                UserId = sub.UserId,
                PlanId = newPlanId,
                StartAt = now,
                RenewalPolicy = sub.RenewalPolicy,
                ExternalPaymentRef = sub.ExternalPaymentRef
            };
            var created = await StartAsync(newDto, triggeredByUserId, reason ?? "Plan değişikliği"); // Tek-aktif kuralı zaten burada geçerli

            var newSubEntity = await _subRepo.GetById(created.Id, ignoreQueryFilter: true)
                               ?? throw new InvalidOperationException("Yeni abonelik bulunamadı.");

            await LogChangeAsync(
                SubscriptionChangeType.PlanChanged,
                newSubEntity,
                oldPlanId,
                newPlanId,
                oldAmount,
                newSubEntity.UnitPrice,
                newSubEntity.Currency,
                triggeredByUserId,
                reason);

            // Yeni plan free değilse fatura oluştur
            var newPlan = await _planRepo.GetById(newPlanId)
                         ?? throw new KeyNotFoundException("Yeni plan bulunamadı.");
            
            System.Diagnostics.Debug.WriteLine($"🔍 Plan değişikliği fatura kontrolü - Plan: {newPlan.Name}, IsFree: {newPlan.IsFree}, UnitPrice: {newSubEntity.UnitPrice}");
            
            if (!newPlan.IsFree)
            {
                // Free plan değilse mutlaka fatura oluştur (fiyat 0 olsa bile)
                try
                {
                    // Subscription'ı tekrar çek (tracking için)
                    var savedNewSub = await _subRepo.GetById(newSubEntity.Id, ignoreQueryFilter: true);
                    if (savedNewSub != null)
                    {
                        System.Diagnostics.Debug.WriteLine($"📝 Plan değişikliği fatura oluşturma başlatılıyor - SubscriptionId: {savedNewSub.Id}");
                        var invoiceId = await CreateInvoiceForSubscriptionAsync(savedNewSub, newPlan, newSubEntity.UnitPrice, newSubEntity.Currency, now, newSubEntity.CurrentPeriodEnd);
                        if (invoiceId.HasValue)
                        {
                            System.Diagnostics.Debug.WriteLine($"✅ Plan değişikliği için fatura oluşturuldu - InvoiceId: {invoiceId.Value}, SubscriptionId: {savedNewSub.Id}");
                        }
                        else
                        {
                            System.Diagnostics.Debug.WriteLine($"⚠️ Plan değişikliği için fatura oluşturulamadı (null döndü) - SubscriptionId: {savedNewSub.Id}");
                        }
                    }
                    else
                    {
                        System.Diagnostics.Debug.WriteLine($"⚠️ Subscription bulunamadı - SubscriptionId: {newSubEntity.Id}");
                    }
                }
                catch (Exception ex)
                {
                    // Fatura oluşturma hatası - log'la ama plan değişikliğini engelleme
                    System.Diagnostics.Debug.WriteLine($"❌ Plan değişikliği fatura oluşturma hatası: {ex.Message}");
                    if (ex.InnerException != null)
                    {
                        System.Diagnostics.Debug.WriteLine($"   Inner Exception: {ex.InnerException.Message}");
                    }
                    System.Diagnostics.Debug.WriteLine($"Stack Trace: {ex.StackTrace}");
                }
            }
            else
            {
                System.Diagnostics.Debug.WriteLine($"ℹ️ Free plan - Fatura oluşturulmayacak - Plan: {newPlan.Name}");
            }

            return created;
        }

        public async Task CancelAsync(Guid subscriptionId, DateTime? endAt = null, Guid? triggeredByUserId = null, string? reason = null)
        {
            var entity = await _subRepo.GetById(subscriptionId, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Subscription bulunamadı.");

            entity.Status = Status.Deleted;
            entity.EndAt = endAt ?? DateTime.UtcNow;
            entity.ModifiedDate = DateTime.UtcNow;
            entity.CancellationReason = reason;

            await _subRepo.Update(entity);
            await _uow.SaveChangesAsync();

            await LogChangeAsync(
                SubscriptionChangeType.Cancelled,
                entity,
                entity.PlanId,
                null,
                entity.UnitPrice,
                null,
                entity.Currency,
                triggeredByUserId,
                reason);
        }
        #endregion

        #region Sorgular
        public async Task<SubscriptionDTO?> GetActiveAsync(Guid appId, Guid userId)
        {
            var q = await _subRepo.GetBy(x =>
                x.AppId == appId &&
                x.UserId == userId &&
                x.Status != Status.Deleted &&
                (x.EndAt == null || x.EndAt > DateTime.UtcNow));

            var entity = await q.AsNoTracking()
                                .OrderByDescending(x => x.CreatedDate)
                                .FirstOrDefaultAsync();
            return entity?.Adapt<SubscriptionDTO>();
        }

        public async Task<List<SubscriptionDTO>> GetByUserAsync(Guid userId)
        {
            var q = await _subRepo.GetBy(x => x.UserId == userId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.CreatedDate)
                          .ProjectToType<SubscriptionDTO>()
                          .ToListAsync();
        }

        public async Task<List<SubscriptionDTO>> GetByAppAsync(Guid appId)
        {
            var q = await _subRepo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.CreatedDate)
                          .ProjectToType<SubscriptionDTO>()
                          .ToListAsync();
        }

        public async Task<List<SubscriptionChangeLogDTO>> GetChangeHistoryAsync(Guid subscriptionId)
        {
            var q = await _changeRepo.GetBy(x => x.SubscriptionId == subscriptionId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.EffectiveDate)
                          .ProjectToType<SubscriptionChangeLogDTO>()
                          .ToListAsync();
        }
        #endregion

        #region SubscriptionItem yardımcıları
        public async Task RebuildItemsFromPlanAsync(Guid subscriptionId)
        {
            var sub = await _subRepo.GetById(subscriptionId)
                      ?? throw new KeyNotFoundException("Subscription bulunamadı.");

            // Mevcut item’ları sil (soft delete)
            var existing = await _itemRepo.GetBy(x => x.SubscriptionId == subscriptionId && x.Status != Status.Deleted);
            var list = await existing.ToListAsync();

            foreach (var it in list)
            {
                it.Status = Status.Deleted;
                it.ModifiedDate = DateTime.UtcNow;
                await _itemRepo.Update(it);
            }

            await SeedSubscriptionItemsFromPlan(subscriptionId, sub.PlanId, sub.StartAt);
            await _uow.SaveChangesAsync();
        }

        private async Task SeedSubscriptionItemsFromPlan(Guid subscriptionId, Guid planId, DateTime startAt)
        {
            var pfs = await (await _pfRepo.GetBy(x => x.PlanId == planId && x.Status != Status.Deleted))
                                   .AsNoTracking().ToListAsync();

            var now = DateTime.UtcNow;
            foreach (var pf in pfs)
            {
                var item = new SubscriptionItem
                {
                    Id = Guid.NewGuid(),
                    Status = Status.Active,
                    CreatedDate = now,
                    ModifiedDate = now,
                    SubscriptionId = subscriptionId,
                    FeatureId = pf.FeatureId,
                    Allotted = pf.Limit,          // null = sınırsız
                    Used = 0m,
                    ResetsAt = CalcResetAt(startAt, pf.ResetInterval)
                };
                await _itemRepo.AddAsync(item);
            }
            await _uow.SaveChangesAsync();
        }
        public async Task<List<SubscriptionItemDTO>> GetItemsAsync(Guid subscriptionId)
        {
            var q = await _itemRepo.GetBy(x => x.SubscriptionId == subscriptionId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderBy(x => x.CreatedDate)
                          .ProjectToType<SubscriptionItemDTO>()
                          .ToListAsync();
        }
        #endregion

        #region Yardımcılar
        private static DateTime CalcNextRenewal(DateTime from, BillingPeriod period)
        {
            return period switch
            {
                BillingPeriod.Monthly => from.AddMonths(1),
                BillingPeriod.Yearly => from.AddYears(1),
                _ => from.AddMonths(1)
            };
        }

        private static DateTime? CalcResetAt(DateTime from, ResetInterval interval)
        {
            return interval switch
            {
                ResetInterval.Daily => from.Date.AddDays(1),
                ResetInterval.Weekly => from.Date.AddDays(7),
                ResetInterval.Monthly => from.Date.AddMonths(1),
                ResetInterval.Yearly => from.Date.AddYears(1),
                ResetInterval.OneTime => null,          // Tek seferlik: reset yok
                ResetInterval.Unlimited => null,          // Sınırsız: reset yok
                _ => null
            };
        }

        private async Task<PlanPrice?> GetCurrentPlanPriceAsync(Guid planId)
        {
            var q = await _priceRepo.GetBy(x => x.PlanId == planId && x.Status != Status.Deleted && x.IsCurrent);
            var current = await q.AsNoTracking()
                                 .OrderByDescending(x => x.EffectiveFrom)
                                 .FirstOrDefaultAsync();

            if (current != null)
            {
                return current;
            }

            // IsCurrent işaretlenmemişse yürürlük tarihine göre seç
            var fallbackQ = await _priceRepo.GetBy(x => x.PlanId == planId && x.Status != Status.Deleted && x.EffectiveFrom <= DateTime.UtcNow);
            return await fallbackQ.AsNoTracking()
                                  .OrderByDescending(x => x.EffectiveFrom)
                                  .FirstOrDefaultAsync();
        }

        private async Task LogChangeAsync(
            SubscriptionChangeType changeType,
            Subscription subscriptionSnapshot,
            Guid? oldPlanId,
            Guid? newPlanId,
            decimal? oldAmount,
            decimal? newAmount,
            CurrencyCode? currency,
            Guid? triggeredByUserId,
            string? reason,
            Guid? invoiceId = null,
            string? metadata = null)
        {
            var now = DateTime.UtcNow;

            var log = new SubscriptionChangeLog
            {
                Id = Guid.NewGuid(),
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now,
                SubscriptionId = subscriptionSnapshot.Id,
                AppId = subscriptionSnapshot.AppId,
                UserId = subscriptionSnapshot.UserId,
                ChangeType = changeType,
                OldPlanId = oldPlanId,
                NewPlanId = newPlanId,
                InvoiceId = invoiceId,
                TriggeredByUserId = triggeredByUserId,
                EffectiveDate = now,
                OldAmount = oldAmount,
                NewAmount = newAmount,
                Currency = currency,
                Reason = reason,
                Metadata = metadata
            };

            await _changeRepo.AddAsync(log);
            await _uow.SaveChangesAsync();
        }

        private async Task<Guid?> CreateInvoiceForSubscriptionAsync(
            Subscription subscription,
            Plan plan,
            decimal unitPrice,
            CurrencyCode currency,
            DateTime periodStart,
            DateTime periodEnd)
        {
            try
            {
                var invoiceRepo = _uow.Repository<Invoice>();
                var userRepo = _uow.Repository<AppUser>();
                var appRepo = _uow.Repository<App>();
                var now = DateTime.UtcNow;

                // Kullanıcı ve uygulama bilgilerini al
                var user = await userRepo.GetById(subscription.UserId);
                var app = await appRepo.GetById(subscription.AppId);

                System.Diagnostics.Debug.WriteLine($"📄 Fatura oluşturuluyor - SubscriptionId: {subscription.Id}, Plan: {plan.Name}, Price: {unitPrice}, User: {user?.UserName}, App: {app?.Name}");

                // Fatura açıklaması oluştur
                var renewalPolicyText = subscription.RenewalPolicy switch
                {
                    RenewalPolicy.Auto => "Otomatik Yenileme",
                    RenewalPolicy.Manual => "Manuel Yenileme",
                    RenewalPolicy.None => "Yenileme Yok",
                    _ => "Bilinmiyor"
                };

                var billingPeriodText = plan.BillingPeriod switch
                {
                    BillingPeriod.Monthly => "Aylık",
                    BillingPeriod.Yearly => "Yıllık",
                    BillingPeriod.Weekly => "Haftalık",
                    BillingPeriod.Daily => "Günlük",
                    _ => "Bilinmiyor"
                };

                // Fatura entity'sini direkt oluştur (ID'yi almak için)
                var invoice = new Invoice
                {
                    Id = Guid.NewGuid(),
                    AppId = subscription.AppId,
                    UserId = subscription.UserId,
                    PeriodStart = periodStart,
                    PeriodEnd = periodEnd,
                    Currency = currency,
                    Subtotal = unitPrice,
                    Tax = 0m, // Vergi hesaplaması gerekirse buraya eklenebilir
                    Total = unitPrice,
                    PaymentStatus = PaymentStatus.Pending,
                    PaymentReference = subscription.ExternalPaymentRef ?? $"SUB-{subscription.Id}",
                    DueDate = periodEnd,
                    RequiresAction = false,
                    Status = Status.Active,
                    CreatedDate = now,
                    ModifiedDate = now,
                    PaymentAttemptCount = 0
                };

                await invoiceRepo.AddAsync(invoice);
                await _uow.SaveChangesAsync();
                System.Diagnostics.Debug.WriteLine($"✅ Fatura oluşturuldu - InvoiceId: {invoice.Id}");

                // Detaylı fatura satırı açıklaması
                var lineDescription = $"{plan.Name} Abonelik\n" +
                    $"• Plan: {plan.Name}\n" +
                    $"• Dönem: {periodStart:dd.MM.yyyy} - {periodEnd:dd.MM.yyyy}\n" +
                    $"• Faturalama: {billingPeriodText}\n" +
                    $"• Yenileme: {renewalPolicyText}\n" +
                    $"• Uygulama: {app?.Name ?? "Bilinmiyor"}\n" +
                    $"• Kullanıcı: {user?.UserName ?? user?.Email ?? "Bilinmiyor"}";

                // Fatura satırı ekle
                var invoiceLine = new InvoiceLineAddDTO
                {
                    InvoiceId = invoice.Id,
                    Description = lineDescription,
                    PlanId = plan.Id,
                    Quantity = 1m,
                    UnitPrice = unitPrice,
                    Amount = unitPrice
                };

                await _invoiceService.AddLineAsync(invoiceLine);
                await _uow.SaveChangesAsync();
                System.Diagnostics.Debug.WriteLine($"✅ Fatura satırı eklendi - InvoiceId: {invoice.Id}");

                // Aboneliğe fatura ID'sini kaydet
                var subToUpdate = await _subRepo.GetById(subscription.Id, ignoreQueryFilter: true);
                if (subToUpdate != null)
                {
                    subToUpdate.LastInvoiceId = invoice.Id;
                    subToUpdate.LastInvoicedAt = now;
                    await _subRepo.Update(subToUpdate);
                    await _uow.SaveChangesAsync();
                    System.Diagnostics.Debug.WriteLine($"✅ Abonelik güncellendi - SubscriptionId: {subToUpdate.Id}, InvoiceId: {invoice.Id}");
                }

                return invoice.Id;
            }
            catch (Exception ex)
            {
                // Fatura oluşturma hatası - log'la ama abonelik oluşturmayı engelleme
                var errorMessage = $"❌ Fatura oluşturma hatası: {ex.Message}";
                if (ex.InnerException != null)
                {
                    errorMessage += $"\nInner: {ex.InnerException.Message}";
                }
                System.Diagnostics.Debug.WriteLine(errorMessage);
                System.Diagnostics.Debug.WriteLine($"Stack Trace: {ex.StackTrace}");
                
                // Exception'ı tekrar fırlatma - sadece log'la
            }

            return null;
        }
        #endregion
    }
}
