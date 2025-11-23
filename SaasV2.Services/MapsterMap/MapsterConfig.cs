using Mapster;
using SaasV2.Core.Enums;
using SaasV2.Entity;

// Identity DTOs
using SaasV2.DTOs.UserDTOs;
using SaasV2.DTOs.RoleDTOs;

// SaaS DTOs
using SaasV2.DTOs.AppDTOs;
using SaasV2.DTOs.AppUserRegistrationDTOs;
using SaasV2.DTOs.PlanDTOs;
using SaasV2.DTOs.PlanPriceDTOs;
using SaasV2.DTOs.FeatureDTOs;
using SaasV2.DTOs.PlanFeatureDTOs;
using SaasV2.DTOs.SubscriptionDTOs;
using SaasV2.DTOs.SubscriptionItemDTOs;
using SaasV2.DTOs.UsageRecordDTOs;
using SaasV2.DTOs.ApiKeyDTOs;
using SaasV2.DTOs.WebhookDTOs;
using SaasV2.DTOs.OutboxDTOs;
using SaasV2.DTOs.InvoiceDTOs;

namespace SaasV2.Services.MapsterMap
{
    public class MapsterConfig : IRegister
    {
        public void Register(TypeAdapterConfig config)
        {
            // Genel kural: Add/Update mappinglerinde audit ve AutoID server tarafında yönetilir.
            // Id sadece UpdateDTO -> Entity’de map’lenir.

            #region Helpers (Optional global tweaks)
            // Null gelen alanları yok saymak istersen aç:
            // config.Default.IgnoreNullValues(true);
            #endregion

            #region App
            config.NewConfig<App, AppDTO>();

            config.NewConfig<AppAddDTO, App>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<AppUpdateDTO, App>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region AppUserRegistration
            config.NewConfig<AppUserRegistration, AppUserRegistrationDTO>();

            config.NewConfig<AppUserRegistrationAddDTO, AppUserRegistration>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<AppUserRegistrationUpdateDTO, AppUserRegistration>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region Plan
            config.NewConfig<Plan, PlanDTO>();

            config.NewConfig<PlanAddDTO, Plan>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<PlanUpdateDTO, Plan>()
                  .Ignore(dest => dest.Status)           // Status update DTO’da yok; servis belirler
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region PlanPrice
            config.NewConfig<PlanPrice, PlanPriceDTO>();

            config.NewConfig<PlanPriceAddDTO, PlanPrice>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<PlanPriceUpdateDTO, PlanPrice>()
                  .Ignore(dest => dest.Status) // fiyat satırı durumunu servis yönetir
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion


            #region Feature
            config.NewConfig<Feature, FeatureDTO>();

            config.NewConfig<FeatureAddDTO, Feature>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<FeatureUpdateDTO, Feature>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion


            #region PlanFeature
            config.NewConfig<PlanFeature, PlanFeatureDTO>();

            config.NewConfig<PlanFeatureAddDTO, PlanFeature>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<PlanFeatureUpdateDTO, PlanFeature>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region Subscription
            config.NewConfig<Subscription, SubscriptionDTO>();
            config.NewConfig<SubscriptionChangeLog, SubscriptionChangeLogDTO>();

            config.NewConfig<SubscriptionAddDTO, Subscription>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status) // oluştururken status’u servis set eder (Approved/Active vs.)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.PlanPriceId)
                  .Ignore(dest => dest.Currency)
                  .Ignore(dest => dest.UnitPrice)
                  .Ignore(dest => dest.CurrentPeriodStart)
                  .Ignore(dest => dest.CurrentPeriodEnd)
                  .Ignore(dest => dest.TrialEndsAt)
                  .Ignore(dest => dest.RenewalAttemptCount)
                  .Ignore(dest => dest.LastInvoicedAt)
                  .Ignore(dest => dest.LastInvoiceId)
                  .Ignore(dest => dest.CancellationReason);

            // SubscriptionUpdateDTO içinde Status var, onu map’liyoruz
            config.NewConfig<SubscriptionUpdateDTO, Subscription>()
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.PlanPriceId)
                  .Ignore(dest => dest.Currency)
                  .Ignore(dest => dest.UnitPrice)
                  .Ignore(dest => dest.CurrentPeriodStart)
                  .Ignore(dest => dest.CurrentPeriodEnd)
                  .Ignore(dest => dest.TrialEndsAt)
                  .Ignore(dest => dest.RenewalAttemptCount)
                  .Ignore(dest => dest.LastInvoicedAt)
                  .Ignore(dest => dest.LastInvoiceId);
            #endregion

            #region SubscriptionItem
            config.NewConfig<SubscriptionItem, SubscriptionItemDTO>();

            config.NewConfig<SubscriptionItemAddDTO, SubscriptionItem>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<SubscriptionItemUpdateDTO, SubscriptionItem>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region UsageRecord
            config.NewConfig<UsageRecord, UsageRecordDTO>();

            config.NewConfig<UsageRecordAddDTO, UsageRecord>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<UsageRecordUpdateDTO, UsageRecord>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region ApiKey
            config.NewConfig<ApiKey, ApiKeyDTO>();

            // AddDTO’da Prefix/Hash istersen server’da üret; burada yine de client’tan gelirse map’lenir.
            config.NewConfig<ApiKeyAddDTO, ApiKey>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.LastUsedAt);

            config.NewConfig<ApiKeyUpdateDTO, ApiKey>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.Prefix) // güncellemede genelde değiştirilmez
                  .Ignore(dest => dest.Hash)   // güncellemede genelde değiştirilmez
                  .Ignore(dest => dest.LastUsedAt);
            #endregion

            #region WebhookEndpoint
            config.NewConfig<WebhookEndpoint, WebhookEndpointDTO>();

            config.NewConfig<WebhookEndpointAddDTO, WebhookEndpoint>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<WebhookEndpointUpdateDTO, WebhookEndpoint>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region WebhookDelivery
            config.NewConfig<WebhookDelivery, WebhookDeliveryDTO>();

            config.NewConfig<WebhookDeliveryAddDTO, WebhookDelivery>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<WebhookDeliveryUpdateDTO, WebhookDelivery>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region OutboxMessage
            config.NewConfig<OutboxMessage, OutboxMessageDTO>();

            config.NewConfig<OutboxMessageAddDTO, OutboxMessage>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.Retries)      // yeni kayıt 0’dan başlar
                  .Ignore(dest => dest.ProcessedAt); // işlenmemiş

            config.NewConfig<OutboxMessageUpdateDTO, OutboxMessage>()
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.Type)     // tip değişmez
                  .Ignore(dest => dest.Payload); // payload değişmez
            #endregion

            #region Invoice
            config.NewConfig<Invoice, InvoiceDTO>();

            config.NewConfig<InvoiceAddDTO, Invoice>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            // InvoiceUpdateDTO Status içeriyor; map’le
            config.NewConfig<InvoiceUpdateDTO, Invoice>()
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region InvoicePaymentAttempt
            config.NewConfig<InvoicePaymentAttempt, InvoicePaymentAttemptDTO>();

            config.NewConfig<InvoicePaymentAttemptDTO, InvoicePaymentAttempt>()
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID)
                  .Ignore(dest => dest.Status);
            #endregion

            #region InvoiceLine
            config.NewConfig<InvoiceLine, InvoiceLineDTO>();

            config.NewConfig<InvoiceLineAddDTO, InvoiceLine>()
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);

            config.NewConfig<InvoiceLineUpdateDTO, InvoiceLine>()
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region Identity: AppUser
            config.NewConfig<AppUser, UserDTO>()
                  .Map(dest => dest.UserId, src => src.Id)
                  .Map(dest => dest.UserName, src => src.UserName)
                  .Map(dest => dest.Email, src => src.Email)
                  .Map(dest => dest.Phone, src => src.PhoneNumber)
                  .Map(dest => dest.Status, src => src.Status);

            // RegisterDTO -> AppUser (şifre hash’leme servis katmanında)
            config.NewConfig<RegisterDTO, AppUser>()
                  .Ignore(dest => dest.Id)
                  .Map(dest => dest.UserName, src => src.UserName)
                  .Map(dest => dest.Email, src => src.Email)
                  .Map(dest => dest.PhoneNumber, src => src.Phone)
                  .Ignore(dest => dest.PasswordHash) // Identity yönetecek
                  .Ignore(dest => dest.SecurityStamp)
                  .Ignore(dest => dest.ConcurrencyStamp)
                  .Ignore(dest => dest.AccessFailedCount)
                  .Ignore(dest => dest.LockoutEnabled)
                  .Ignore(dest => dest.LockoutEnd)
                  .Ignore(dest => dest.TwoFactorEnabled)
                  .Ignore(dest => dest.EmailConfirmed)
                  .Ignore(dest => dest.PhoneNumberConfirmed)
                  // audit & our base fields
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion

            #region Identity: AppRole
            config.NewConfig<AppRole, RoleDTO>()
                  .Map(dest => dest.Id, src => src.Id)
                  .Map(dest => dest.Name, src => src.Name)
                  .Map(dest => dest.Status, src => src.Status)
                  .Map(dest => dest.CratedDate, src => src.CreatedDate); // DTO alanı 'CratedDate'

            config.NewConfig<RoleAddDTO, AppRole>()
                  .Map(dest => dest.Name, src => src.Name)
                  .Ignore(dest => dest.Id)
                  .Ignore(dest => dest.NormalizedName)
                  .Ignore(dest => dest.ConcurrencyStamp)
                  // audit & our base fields
                  .Ignore(dest => dest.Status)
                  .Ignore(dest => dest.CreatedDate)
                  .Ignore(dest => dest.ModifiedDate)
                  .Ignore(dest => dest.AutoID);
            #endregion
        }
    }
}
