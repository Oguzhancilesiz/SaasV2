using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.OutboxDTOs;
using SaasV2.DTOs.WebhookDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System.Net;
using System.Text;

namespace SaasV2.Services.Concrete
{
    public class WebhookDeliveryService : IWebhookDeliveryService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<WebhookEndpoint> _endpointRepo;
        private readonly IBaseRepository<WebhookDelivery> _deliveryRepo;
        private readonly IBaseRepository<OutboxMessage> _outboxRepo;
        private readonly IHttpClientFactory _httpClientFactory;

        public WebhookDeliveryService(IUnitOfWork uow, IHttpClientFactory httpClientFactory)
        {
            _uow = uow;
            _endpointRepo = _uow.Repository<WebhookEndpoint>();
            _deliveryRepo = _uow.Repository<WebhookDelivery>();
            _outboxRepo = _uow.Repository<OutboxMessage>();
            _httpClientFactory = httpClientFactory;
        }

        #region IBaseService
        public async Task Add(WebhookDeliveryAddDTO dto)
        {
            var now = DateTime.UtcNow;
            var entity = dto.Adapt<WebhookDelivery>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _deliveryRepo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(WebhookDeliveryUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _deliveryRepo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Delivery bulunamadı.");

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _deliveryRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _deliveryRepo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Delivery bulunamadı.");

            entity.Status = Status.Deleted;
            entity.ModifiedDate = DateTime.UtcNow;

            await _deliveryRepo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<WebhookDeliveryDTO>> GetAll()
        {
            var q = await _deliveryRepo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.AttemptedAt)
                          .ProjectToType<WebhookDeliveryDTO>()
                          .ToListAsync();
        }

        public async Task<WebhookDeliveryDTO> GetById(Guid id)
        {
            var entity = await _deliveryRepo.GetById(id)
                         ?? throw new KeyNotFoundException("Delivery bulunamadı.");
            return entity.Adapt<WebhookDeliveryDTO>();
        }
        #endregion

        public async Task<WebhookDeliveryDTO> SendToEndpointAsync(Guid endpointId, string eventType, string payloadJson, string idempotencyKey = null, DateTime? occurredAt = null)
        {
            var endpoint = await _endpointRepo.GetById(endpointId)
                           ?? throw new KeyNotFoundException("Endpoint bulunamadı.");

            if (!endpoint.IsActive || endpoint.Status == Status.Deleted)
                throw new InvalidOperationException("Endpoint aktif değil.");

            var client = _httpClientFactory.CreateClient("webhook");
            var ts = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
            var idempo = idempotencyKey ?? Guid.NewGuid().ToString();

            using var req = new HttpRequestMessage(HttpMethod.Post, endpoint.Url);
            WebhookEndpointService.AddSignatureHeaders(req, endpoint.Secret, payloadJson, ts, idempo);
            req.Headers.TryAddWithoutValidation("X-Webhook-Event", eventType);
            req.Headers.TryAddWithoutValidation("Content-Type", "application/json");
            if (occurredAt.HasValue)
                req.Headers.TryAddWithoutValidation("X-Webhook-Occurred-At", occurredAt.Value.ToUniversalTime().ToString("O"));

            req.Content = new StringContent(payloadJson, Encoding.UTF8, "application/json");

            HttpStatusCode status;
            string body = null;
            try
            {
                var resp = await client.SendAsync(req);
                status = resp.StatusCode;
                body = await SafeReadAsync(resp);
            }
            catch (TaskCanceledException)
            {
                status = 0; // timeout
                body = "timeout";
            }
            catch (Exception ex)
            {
                status = 0;
                body = $"error:{ex.Message}";
            }

            // Log delivery
            var now = DateTime.UtcNow;
            var del = new WebhookDelivery
            {
                Id = Guid.NewGuid(),
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now,
                WebhookEndpointId = endpoint.Id,
                EventType = eventType,
                Payload = payloadJson,
                AttemptedAt = now,
                ResponseStatus = (int)status,
                ResponseBody = Truncate(body, 4000),
                Retries = 0
            };
            await _deliveryRepo.AddAsync(del);
            await _uow.SaveChangesAsync();

            return del.Adapt<WebhookDeliveryDTO>();
        }

        public async Task<List<WebhookDeliveryDTO>> BroadcastAsync(Guid appId, string eventType, string payloadJson, string idempotencyKey = null, DateTime? occurredAt = null)
        {
            // İlgili event’i isteyen tüm aktif endpoint’lere gönder
            var endpointsQ = await _endpointRepo.GetBy(x =>
                x.AppId == appId &&
                x.IsActive &&
                x.Status != Status.Deleted &&
               (string.IsNullOrEmpty(x.EventTypesCsv) ||
                x.EventTypesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                               .Contains(eventType)));

            var endpoints = await endpointsQ.AsNoTracking().ToListAsync();

            var results = new List<WebhookDeliveryDTO>(endpoints.Count);
            foreach (var ep in endpoints)
            {
                var r = await SendToEndpointAsync(ep.Id, eventType, payloadJson, idempotencyKey, occurredAt);
                results.Add(r);
            }
            return results;
        }

        public async Task<int> RetryFailedAsync(Guid endpointId, int maxAttempts = 3)
        {
            // 0 veya 5xx olanları çek
            var failedQ = await _deliveryRepo.GetBy(x =>
                x.WebhookEndpointId == endpointId &&
                x.Status != Status.Deleted &&
                (x.ResponseStatus == 0 || x.ResponseStatus >= 500) &&
                x.Retries < maxAttempts);

            var list = await failedQ.OrderBy(x => x.AttemptedAt).ToListAsync();
            int ok = 0;

            foreach (var d in list)
            {
                // küçük bir backoff
                var delayMs = (int)Math.Min(30000, (Math.Pow(2, d.Retries) * 500)); // 0.5s,1s,2s,4s...
                await Task.Delay(delayMs);

                var r = await SendToEndpointAsync(d.WebhookEndpointId, d.EventType, d.Payload);

                // eski kaydı güncelle: retries++
                d.Retries += 1;
                d.ModifiedDate = DateTime.UtcNow;
                await _deliveryRepo.Update(d);

                if (r.ResponseStatus >= 200 && r.ResponseStatus < 300) ok++;
            }
            await _uow.SaveChangesAsync();
            return ok;
        }

        public async Task EnqueueOutboxAsync(Guid? appId, string eventType, string payloadJson, DateTime? occurredAt = null)
        {
            var now = DateTime.UtcNow;
            var msg = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                Status = Status.Active,
                CreatedDate = now,
                ModifiedDate = now,
                AppId = appId,
                Type = eventType,
                Payload = payloadJson,
                OccurredAt = occurredAt ?? now,
                ProcessedAt = null,
                Retries = 0
            };
            await _outboxRepo.AddAsync(msg);
            await _uow.SaveChangesAsync();
        }

        #region Helpers
        private static string Truncate(string s, int max) =>
            string.IsNullOrEmpty(s) ? s : (s.Length <= max ? s : s.Substring(0, max));

        private static async Task<string> SafeReadAsync(HttpResponseMessage resp)
        {
            try
            {
                return await resp.Content.ReadAsStringAsync();
            }
            catch
            {
                return null;
            }
        }
        #endregion
    }
}
