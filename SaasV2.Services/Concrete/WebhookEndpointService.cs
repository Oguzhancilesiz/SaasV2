using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.WebhookDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System.Security.Cryptography;
using System.Text;

namespace SaasV2.Services.Concrete
{
    public class WebhookEndpointService : IWebhookEndpointService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<WebhookEndpoint> _endpointRepo;
        private readonly IHttpClientFactory _httpClientFactory; // TestPing için

        public WebhookEndpointService(IUnitOfWork uow, IHttpClientFactory httpClientFactory)
        {
            _uow = uow;
            _endpointRepo = _uow.Repository<WebhookEndpoint>();
            _httpClientFactory = httpClientFactory;
        }

        #region IBaseService
        public async Task Add(WebhookEndpointAddDTO dto)
        {
            if (dto.AppId == Guid.Empty) throw new ArgumentException("AppId zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Url)) throw new ArgumentException("Url zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Secret)) dto.Secret = GenerateSecret();

            // Aynı App + Url zaten var mı? (soft delete hariç)
            var exists = await _endpointRepo.AnyAsync(x =>
                x.AppId == dto.AppId && x.Url == dto.Url && x.Status != Status.Deleted);
            if (exists) throw new InvalidOperationException("Bu App için aynı URL zaten kayıtlı.");

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<WebhookEndpoint>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _endpointRepo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(WebhookEndpointUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _endpointRepo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            // URL unique’liği
            if (!string.IsNullOrWhiteSpace(dto.Url) && dto.Url != entity.Url)
            {
                var inUse = await _endpointRepo.AnyAsync(x =>
                    x.AppId == entity.AppId &&
                    x.Url == dto.Url &&
                    x.Id != dto.Id &&
                    x.Status != Status.Deleted);
                if (inUse) throw new InvalidOperationException("Aynı App içinde bu URL kullanımda.");
            }

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _endpointRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _endpointRepo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            // Soft delete
            entity.Status = Status.Deleted;
            entity.IsActive = false;
            entity.ModifiedDate = DateTime.UtcNow;

            await _endpointRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<WebhookEndpointDTO>> GetAll()
        {
            var q = await _endpointRepo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.CreatedDate)
                          .ProjectToType<WebhookEndpointDTO>()
                          .ToListAsync();
        }

        public async Task<WebhookEndpointDTO> GetById(Guid id)
        {
            var entity = await _endpointRepo.GetById(id)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");
            return entity.Adapt<WebhookEndpointDTO>();
        }
        #endregion

        public async Task<List<WebhookEndpointDTO>> GetByAppAsync(Guid appId)
        {
            var q = await _endpointRepo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.IsActive)
                          .ThenBy(x => x.Url)
                          .ProjectToType<WebhookEndpointDTO>()
                          .ToListAsync();
        }

        public async Task<List<WebhookEndpointDTO>> GetActiveByAppAndEventAsync(Guid appId, string eventType)
        {
            var q = await _endpointRepo.GetBy(x =>
                x.AppId == appId &&
                x.IsActive &&
                x.Status != Status.Deleted &&
                (string.IsNullOrEmpty(x.EventTypesCsv) ||
                 x.EventTypesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                                 .Contains(eventType)));
            return await q.AsNoTracking()
                          .ProjectToType<WebhookEndpointDTO>()
                          .ToListAsync();
        }

        public async Task RotateSecretAsync(Guid endpointId)
        {
            var entity = await _endpointRepo.GetById(endpointId, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            entity.Secret = GenerateSecret();
            entity.ModifiedDate = DateTime.UtcNow;

            await _endpointRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task ActivateAsync(Guid endpointId)
        {
            var entity = await _endpointRepo.GetById(endpointId, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            entity.IsActive = true;
            entity.Status = Status.Active;
            entity.ModifiedDate = DateTime.UtcNow;

            await _endpointRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task DeactivateAsync(Guid endpointId)
        {
            var entity = await _endpointRepo.GetById(endpointId, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            entity.IsActive = false;
            entity.ModifiedDate = DateTime.UtcNow;

            await _endpointRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<WebhookEndpointDTO> TestPingAsync(Guid endpointId)
        {
            var entity = await _endpointRepo.GetById(endpointId)
                         ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            var client = _httpClientFactory.CreateClient("webhook");
            var payload = """{"type":"webhook.ping","message":"ok"}""";

            using var req = new HttpRequestMessage(HttpMethod.Post, entity.Url);
            AddSignatureHeaders(req, entity.Secret, payload, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), Guid.NewGuid().ToString());
            req.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            var resp = await client.SendAsync(req);
            // sadece hatalıysa exception; loglamayı DeliveryService yapıyor
            if (!resp.IsSuccessStatusCode)
                throw new InvalidOperationException($"Ping başarısız: {(int)resp.StatusCode}");

            return entity.Adapt<WebhookEndpointDTO>();
        }

        #region Helpers
        private static string GenerateSecret()
        {
            var bytes = RandomNumberGenerator.GetBytes(32);
            return Convert.ToBase64String(bytes);
        }

        public static void AddSignatureHeaders(HttpRequestMessage req, string secret, string payload, string ts, string idempo)
        {
            // Basit HMAC-SHA256 imzası: hex(hmac(secret, ts + "." + payload))
            var data = $"{ts}.{payload}";
            using var hmac = new HMACSHA256(Convert.FromBase64String(secret));
            var sig = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            var sigHex = Convert.ToHexString(sig).ToLowerInvariant();

            req.Headers.TryAddWithoutValidation("X-Webhook-Timestamp", ts);
            req.Headers.TryAddWithoutValidation("X-Webhook-Signature", $"v1={sigHex}");
            req.Headers.TryAddWithoutValidation("Idempotency-Key", idempo);
        }
        #endregion
    }
}
