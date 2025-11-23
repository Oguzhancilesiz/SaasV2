using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.AppUserRegistrationDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class AppUserRegistrationService : IAppUserRegistrationService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<AppUserRegistration> _repo;

        public AppUserRegistrationService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<AppUserRegistration>();
        }

        public async Task<AppUserRegistrationDTO> EnsureAsync(AppUserRegistrationAddDTO dto)
        {
            Normalize(dto);

            // 1) Önce (AppId, UserId) ile var mı?
            var existing = await _repo.GetBy(x => x.AppId == dto.AppId
                                               && x.UserId == dto.UserId
                                               && x.Status != Status.Deleted);
            var entity = await existing.AsNoTracking().FirstOrDefaultAsync();
            if (entity != null)
                return entity.Adapt<AppUserRegistrationDTO>();

            // 2) Dış sağlayıcıyla eşleşme (ExternalId doluysa)
            if (!string.IsNullOrWhiteSpace(dto.ExternalId) && !string.IsNullOrWhiteSpace(dto.Provider))
            {
                var byExternal = await _repo.GetBy(x => x.AppId == dto.AppId
                                                     && x.Provider == dto.Provider
                                                     && x.ExternalId == dto.ExternalId
                                                     && x.Status != Status.Deleted);
                var ext = await byExternal.AsNoTracking().FirstOrDefaultAsync();
                if (ext != null)
                    return ext.Adapt<AppUserRegistrationDTO>();
            }

            // 3) Yoksa oluştur
            var now = DateTime.UtcNow;
            var newEntity = dto.Adapt<AppUserRegistration>();
            newEntity.Id = Guid.NewGuid();
            newEntity.Status = Status.Active;
            newEntity.CreatedDate = now;
            newEntity.ModifiedDate = now;
            if (newEntity.RegisteredAt == default) newEntity.RegisteredAt = now;

            await _repo.AddAsync(newEntity);
            await _uow.SaveChangesAsync();

            return newEntity.Adapt<AppUserRegistrationDTO>();
        }

        public async Task Add(AppUserRegistrationAddDTO dto)
        {
            Normalize(dto);

            // Tekilleştirme: (AppId, UserId)
            var duplication = await _repo.AnyAsync(x => x.AppId == dto.AppId
                                                     && x.UserId == dto.UserId
                                                     && x.Status != Status.Deleted);
            if (duplication)
                throw new InvalidOperationException("Bu kullanıcı bu uygulamaya zaten kayıtlı.");

            // Dış sağlayıcı tekilliği (ExternalId doluysa)
            if (!string.IsNullOrWhiteSpace(dto.ExternalId) && !string.IsNullOrWhiteSpace(dto.Provider))
            {
                var dupExt = await _repo.AnyAsync(x => x.AppId == dto.AppId
                                                    && x.Provider == dto.Provider
                                                    && x.ExternalId == dto.ExternalId
                                                    && x.Status != Status.Deleted);
                if (dupExt)
                    throw new InvalidOperationException("Bu dış kimlik bu uygulamada zaten kullanılmış.");
            }

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<AppUserRegistration>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            if (entity.RegisteredAt == default) entity.RegisteredAt = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(AppUserRegistrationUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Kayıt bulunamadı.");

            // Provider/ExternalId değişirse filtered unique’i ihlal etmesin
            var provider = dto.Provider?.Trim().ToLowerInvariant();
            var externalId = dto.ExternalId?.Trim();

            if (!string.IsNullOrWhiteSpace(externalId) && !string.IsNullOrWhiteSpace(provider))
            {
                var conflict = await _repo.AnyAsync(x => x.Id != dto.Id
                                                      && x.AppId == entity.AppId
                                                      && x.Provider == provider
                                                      && x.ExternalId == externalId
                                                      && x.Status != Status.Deleted);
                if (conflict)
                    throw new InvalidOperationException("Bu dış kimlik başka bir kayıtla çakışıyor.");
            }

            entity.RegisteredAt = dto.RegisteredAt == default ? entity.RegisteredAt : dto.RegisteredAt.ToUniversalTime();
            entity.Provider = provider;
            entity.ExternalId = externalId;
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Kayıt bulunamadı.");

            await _repo.Delete(entity); // soft delete
            await _uow.SaveChangesAsync();
        }

        public async Task<List<AppUserRegistrationDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking().ProjectToType<AppUserRegistrationDTO>().ToListAsync();
        }

        public async Task<AppUserRegistrationDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id)
                         ?? throw new KeyNotFoundException("Kayıt bulunamadı.");
            return entity.Adapt<AppUserRegistrationDTO>();
        }

        public async Task<AppUserRegistrationDTO> GetByAppAndUserAsync(Guid appId, Guid userId)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.UserId == userId && x.Status != Status.Deleted);
            var entity = await q.AsNoTracking().FirstOrDefaultAsync()
                         ?? throw new KeyNotFoundException("Kayıt bulunamadı.");
            return entity.Adapt<AppUserRegistrationDTO>();
        }

        public async Task<List<AppUserRegistrationDTO>> GetByAppAsync(Guid appId)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);
            return await q.AsNoTracking().ProjectToType<AppUserRegistrationDTO>().ToListAsync();
        }

        public async Task<List<AppUserRegistrationDTO>> GetByUserAsync(Guid userId)
        {
            var q = await _repo.GetBy(x => x.UserId == userId && x.Status != Status.Deleted);
            return await q.AsNoTracking().ProjectToType<AppUserRegistrationDTO>().ToListAsync();
        }

        public async Task<AppUserRegistrationDTO?> FindByExternalAsync(Guid appId, string provider, string externalId)
        {
            var prov = provider?.Trim().ToLowerInvariant();
            var ext = externalId?.Trim();
            if (string.IsNullOrWhiteSpace(prov) || string.IsNullOrWhiteSpace(ext))
                return null;

            var q = await _repo.GetBy(x => x.AppId == appId
                                        && x.Provider == prov
                                        && x.ExternalId == ext
                                        && x.Status != Status.Deleted);
            var entity = await q.AsNoTracking().FirstOrDefaultAsync();
            return entity?.Adapt<AppUserRegistrationDTO>();
        }

        private static void Normalize(AppUserRegistrationAddDTO dto)
        {
            if (dto.RegisteredAt == default) dto.RegisteredAt = DateTime.UtcNow;
            if (!string.IsNullOrWhiteSpace(dto.Provider))
                dto.Provider = dto.Provider.Trim().ToLowerInvariant();
            if (!string.IsNullOrWhiteSpace(dto.ExternalId))
                dto.ExternalId = dto.ExternalId.Trim();
        }
    }
}
