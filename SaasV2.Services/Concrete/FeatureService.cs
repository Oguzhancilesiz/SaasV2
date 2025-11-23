// FeatureService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.FeatureDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class FeatureService : IFeatureService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Feature> _repo;

        public FeatureService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<Feature>();
        }

        public async Task<FeatureDTO> EnsureAsync(FeatureAddDTO dto)
        {
            Normalize(dto);

            var existingQ = await _repo.GetBy(x => x.AppId == dto.AppId
                                                && x.Key == dto.Key
                                                && x.Status != Status.Deleted);
            var existing = await existingQ.AsNoTracking().FirstOrDefaultAsync();
            if (existing != null)
                return existing.Adapt<FeatureDTO>();

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<Feature>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();

            return entity.Adapt<FeatureDTO>();
        }

        public async Task Add(FeatureAddDTO dto)
        {
            Normalize(dto);

            var dup = await _repo.AnyAsync(x => x.AppId == dto.AppId
                                             && x.Key == dto.Key
                                             && x.Status != Status.Deleted);
            if (dup) throw new InvalidOperationException("Bu app için aynı Key zaten mevcut.");

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<Feature>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(FeatureUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            Normalize(dto);

            var entity = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Feature bulunamadı.");

            // Key veya AppId değişiyorsa tekillik kontrolü
            if (!string.IsNullOrWhiteSpace(dto.Key) &&
                (dto.Key != entity.Key || dto.AppId != entity.AppId))
            {
                var conflict = await _repo.AnyAsync(x => x.Id != dto.Id
                                                      && x.AppId == dto.AppId
                                                      && x.Key == dto.Key
                                                      && x.Status != Status.Deleted);
                if (conflict)
                    throw new InvalidOperationException("Bu app için aynı Key kullanımda.");
            }

            entity = dto.Adapt(entity);
            entity.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var entity = await _repo.GetById(id, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Feature bulunamadı.");

            await _repo.Delete(entity); // soft delete
            await _uow.SaveChangesAsync();
        }

        public async Task<List<FeatureDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking().ProjectToType<FeatureDTO>().ToListAsync();
        }

        public async Task<FeatureDTO> GetById(Guid id)
        {
            var entity = await _repo.GetById(id)
                         ?? throw new KeyNotFoundException("Feature bulunamadı.");
            return entity.Adapt<FeatureDTO>();
        }

        public async Task<FeatureDTO> GetByKeyAsync(Guid appId, string key)
        {
            key = NormalizeKey(key);
            var q = await _repo.GetBy(x => x.AppId == appId && x.Key == key && x.Status != Status.Deleted);
            var entity = await q.AsNoTracking().FirstOrDefaultAsync()
                         ?? throw new KeyNotFoundException("Feature bulunamadı.");
            return entity.Adapt<FeatureDTO>();
        }

        public async Task<List<FeatureDTO>> GetByAppAsync(Guid appId)
        {
            var q = await _repo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);
            return await q.AsNoTracking().ProjectToType<FeatureDTO>().ToListAsync();
        }

        public async Task<List<FeatureDTO>> SearchAsync(Guid appId, string qText)
        {
            var q = await _repo.GetBy(x => x.AppId == appId
                                        && x.Status != Status.Deleted
                                        && (x.Name.Contains(qText) || x.Key.Contains(qText)));
            return await q.AsNoTracking().ProjectToType<FeatureDTO>().ToListAsync();
        }

        private static void Normalize(FeatureAddDTO dto)
        {
            dto.Key = NormalizeKey(dto.Key);
            dto.Name = dto.Name?.Trim();
            dto.Unit = dto.Unit?.Trim();
            dto.Description = dto.Description?.Trim();
        }

        private static void Normalize(FeatureUpdateDTO dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.Key))
                dto.Key = NormalizeKey(dto.Key);
            dto.Name = dto.Name?.Trim();
            dto.Unit = dto.Unit?.Trim();
            dto.Description = dto.Description?.Trim();
        }

        private static string NormalizeKey(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
                throw new ArgumentException("Key zorunlu.");
            return key.Trim().ToLowerInvariant();
        }
    }
}
