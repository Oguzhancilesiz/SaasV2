// ApiKeyService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.ApiKeyDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class ApiKeyService : IApiKeyService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<ApiKey> _repo;
        private readonly IBaseRepository<App> _appRepo;

        public ApiKeyService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<ApiKey>();
            _appRepo = _uow.Repository<App>();
        }

        #region IBaseService

        public async Task Add(ApiKeyAddDTO dto)
        {
            if (dto.AppId == Guid.Empty) throw new ArgumentException("AppId zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Scopes)) dto.Scopes = string.Empty;

            // App var mı
            var app = await _appRepo.GetById(dto.AppId);
            if (app == null || app.Status == Status.Deleted)
                throw new KeyNotFoundException("App bulunamadı.");

            // Prefix/Hash server tarafından da üretilebilir; boş geldiyse random doldur
            var prefix = string.IsNullOrWhiteSpace(dto.Prefix) ? CreatePrefix() : dto.Prefix.Trim();
            var hash = string.IsNullOrWhiteSpace(dto.Hash) ? CreateHash() : dto.Hash.Trim();

            // Aynı App içinde Prefix tekil olsun
            var prefixInUse = await _repo.AnyAsync(x => x.AppId == dto.AppId && x.Prefix == prefix);
            if (prefixInUse) throw new InvalidOperationException("Bu Prefix bu uygulama için kullanımda.");

            // Aynı App içinde Hash tekilliği (güvenlik için mantıklı)
            var hashInUse = await _repo.AnyAsync(x => x.AppId == dto.AppId && x.Hash == hash);
            if (hashInUse) throw new InvalidOperationException("Bu Hash bu uygulama için kullanımda.");

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<ApiKey>();
            entity.Id = Guid.NewGuid();
            entity.Prefix = prefix;
            entity.Hash = hash;
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(ApiKeyUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");

            // Ad, Scopes, ExpiresAt güncellenir; Prefix/Hash dokunmuyoruz
            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");

            await _repo.Delete(entity); // Status = Deleted
            await _uow.SaveChangesAsync();
        }

        public async Task<List<ApiKeyDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return q.AsNoTracking()
                    .OrderByDescending(x => x.CreatedDate)
                    .ProjectToType<ApiKeyDTO>()
                    .ToList();
        }

        public async Task<ApiKeyDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id)
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");

            return entity.Adapt<ApiKeyDTO>();
        }

        #endregion

        #region Extras

        public async Task<List<ApiKeyDTO>> GetByAppAsync(Guid appId, bool includeExpired = false, bool includeDeleted = false)
        {
            var now = DateTime.UtcNow;

            var q = await _repo.GetBy(x => x.AppId == appId);
            if (!includeDeleted) q = q.Where(x => x.Status != Status.Deleted);
            if (!includeExpired) q = q.Where(x => x.ExpiresAt == null || x.ExpiresAt > now);

            return q.AsNoTracking()
                    .OrderByDescending(x => x.CreatedDate)
                    .ProjectToType<ApiKeyDTO>()
                    .ToList();
        }

        public async Task<ApiKeyDTO> GetByPrefixAsync(Guid appId, string prefix)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.Prefix == prefix && x.Status != Status.Deleted);
            var entity = await q.AsNoTracking().FirstOrDefaultAsync()
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");
            return entity.Adapt<ApiKeyDTO>();
        }

        // Aktif mi, süresi dolmamış mı, hash eşleşiyor mu
        public async Task<bool> ValidateAsync(Guid appId, string prefix, string hash)
        {
            var now = DateTime.UtcNow;

            var q = await _repo.GetBy(x =>
                x.AppId == appId &&
                x.Prefix == prefix &&
                x.Status == Status.Active &&
                (x.ExpiresAt == null || x.ExpiresAt > now));

            var entity = await q.AsNoTracking().FirstOrDefaultAsync();
            if (entity is null) return false;

            // Not: burada hash karşılaştırması düz string; prod’da HMAC/slow-hash + timing-safe compare önerilir
            return string.Equals(entity.Hash, hash, StringComparison.Ordinal);
        }

        // Hızlı kapatma: süresini şimdi yap
        public async Task RevokeAsync(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");

            entity.ExpiresAt = DateTime.UtcNow;
            entity.ModifiedDate = entity.ExpiresAt.Value;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task TouchLastUsedAsync(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("ApiKey bulunamadı.");

            entity.LastUsedAt = DateTime.UtcNow;
            entity.ModifiedDate = entity.LastUsedAt.Value;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        #endregion

        #region Helpers

        private static string CreatePrefix()
        {
            // 8-10 char, UI’da gösterilebilir kısım; çakışmayı zaten DB tarafında engelliyoruz
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                   .Replace("=", "").Replace("+", "").Replace("/", "")
                   .Substring(0, 10);
        }

        private static string CreateHash()
        {
            // Demo amaçlı random string. Gerçekte: secret üret + SHA256/HMAC vs ile hashle.
            return Convert.ToBase64String(Guid.NewGuid().ToByteArray())
                   .Replace("=", "").Replace("+", "").Replace("/", "");
        }

        #endregion
    }
}
