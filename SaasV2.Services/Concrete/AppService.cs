// AppService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.AppDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class AppService : IAppService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<App> _repo;

        public AppService(IUnitOfWork uow)
        {
            _uow = uow;
            _repo = _uow.Repository<App>();
        }

        public async Task Add(AppAddDTO dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) throw new ArgumentException("Name zorunlu.");
            if (string.IsNullOrWhiteSpace(dto.Code)) throw new ArgumentException("Code zorunlu.");

            var name = dto.Name.Trim();
            var code = dto.Code.Trim(); // slug üreteceksen burada üret

            var exists = await _repo.AnyAsync(x =>
                x.Status != Status.Deleted &&
                (x.Name == name || x.Code == code));

            if (exists) throw new InvalidOperationException("Aynı isim veya Code zaten mevcut.");

            string? workspaceKey = string.IsNullOrWhiteSpace(dto.WorkspaceKey)
                ? null
                : dto.WorkspaceKey.Trim();

            if (!string.IsNullOrEmpty(workspaceKey))
            {
                var workspaceExists = await _repo.AnyAsync(x =>
                    x.Status != Status.Deleted &&
                    x.WorkspaceKey == workspaceKey);

                if (workspaceExists) throw new InvalidOperationException("Workspace anahtarı kullanımda.");
            }

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<App>();
            entity.Id = Guid.NewGuid();
            entity.Name = name;
            entity.Code = code;
            entity.WorkspaceKey = workspaceKey;
            entity.Environment = dto.Environment;
            entity.OwnerContactEmail = NormalizeEmail(dto.OwnerContactEmail);
            entity.BillingContactEmail = NormalizeEmail(dto.BillingContactEmail);
            entity.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;

            await _repo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }


        public async Task Update(AppUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");

            var app = await _repo.GetById(dto.Id, ignoreQueryFilter: true)
                      ?? throw new KeyNotFoundException("App bulunamadı.");

            var existingCode = app.Code;
            var existingWorkspaceKey = app.WorkspaceKey;

            dto.Adapt(app);

            // Code değişiyorsa tekillik kontrolü
            if (!string.IsNullOrWhiteSpace(dto.Code))
            {
                var trimmedCode = dto.Code.Trim();
                if (!string.Equals(trimmedCode, existingCode, StringComparison.OrdinalIgnoreCase))
                {
                    var codeUsed = await _repo.AnyAsync(x => x.Code == trimmedCode && x.Id != dto.Id);
                    if (codeUsed) throw new InvalidOperationException("Code kullanımda.");
                }
                app.Code = trimmedCode;
            }

            app.Name = app.Name?.Trim();
            app.Description = app.Description?.Trim();

            app.OwnerContactEmail = NormalizeEmail(dto.OwnerContactEmail);
            app.BillingContactEmail = NormalizeEmail(dto.BillingContactEmail);
            app.Notes = string.IsNullOrWhiteSpace(dto.Notes) ? null : dto.Notes.Trim();

            string? workspaceKey = string.IsNullOrWhiteSpace(dto.WorkspaceKey)
                ? null
                : dto.WorkspaceKey.Trim();

            if (!string.Equals(workspaceKey, existingWorkspaceKey, StringComparison.OrdinalIgnoreCase))
            {
                var workspaceExists = await _repo.AnyAsync(x =>
                    x.Status != Status.Deleted &&
                    x.Id != dto.Id &&
                    x.WorkspaceKey == workspaceKey);

                if (workspaceExists) throw new InvalidOperationException("Workspace anahtarı kullanımda.");
            }

            app.WorkspaceKey = workspaceKey;
            app.Environment = dto.Environment;

            app.ModifiedDate = DateTime.UtcNow;

            await _repo.Update(app);
            await _uow.SaveChangesAsync();
        }


        public async Task Delete(Guid id)
        {
            var app = await _repo.GetById(id, ignoreQueryFilter: true) ?? throw new KeyNotFoundException("App bulunamadı.");
            await _repo.Delete(app);
            await _uow.SaveChangesAsync();
        }

        public async Task<List<AppDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            return await q.AsNoTracking()
                          .OrderByDescending(x => x.CreatedDate)
                          .ProjectToType<AppDTO>()
                          .ToListAsync();
        }

        public async Task<AppDTO> GetById(Guid id)
        {
            var app = await _repo.GetById(id) ?? throw new KeyNotFoundException("App bulunamadı.");
            return app.Adapt<AppDTO>();
        }

        public async Task<AppDTO> GetByCodeAsync(string code)
        {
            code = code?.Trim();
            var q = await _repo.GetBy(x => x.Code == code && x.Status != Status.Deleted);
            var app = await q.AsNoTracking().FirstOrDefaultAsync()
                      ?? throw new KeyNotFoundException("App bulunamadı.");
            return app.Adapt<AppDTO>();
        }

        public async Task<AppFilterResponse> GetFilteredAsync(AppFilterRequest request)
        {
            var query = await _repo.GetAllActives();
            query = query.AsNoTracking();

            // Arama filtresi
            if (!string.IsNullOrWhiteSpace(request.SearchQuery))
            {
                var search = request.SearchQuery.Trim().ToLower();
                query = query.Where(x =>
                    x.Name.ToLower().Contains(search) ||
                    x.Code.ToLower().Contains(search) ||
                    (x.Description != null && x.Description.ToLower().Contains(search))
                );
            }

            // Status filtresi
            if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "all")
            {
                if (request.Status == "active")
                {
                    query = query.Where(x => x.Status == Status.Active);
                }
                else if (request.Status == "passive")
                {
                    query = query.Where(x => x.Status != Status.Active);
                }
            }

            // Toplam kayıt sayısı (pagination için)
            var totalCount = await query.CountAsync();

            // Sıralama
            query = request.Sort switch
            {
                "name_asc" => query.OrderBy(x => x.Name),
                "name_desc" => query.OrderByDescending(x => x.Name),
                "code_asc" => query.OrderBy(x => x.Code),
                "code_desc" => query.OrderByDescending(x => x.Code),
                "created_asc" => query.OrderBy(x => x.CreatedDate),
                "created_desc" => query.OrderByDescending(x => x.CreatedDate),
                _ => query.OrderByDescending(x => x.CreatedDate) // Varsayılan
            };

            // Pagination
            var page = Math.Max(1, request.Page);
            var pageSize = Math.Max(1, Math.Min(100, request.PageSize)); // Max 100 kayıt
            var skip = (page - 1) * pageSize;

            var items = await query
                .Skip(skip)
                .Take(pageSize)
                .ProjectToType<AppDTO>()
                .ToListAsync();

            var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

            return new AppFilterResponse
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = totalPages,
                HasNextPage = page < totalPages,
                HasPreviousPage = page > 1
            };
        }

        private static string? NormalizeEmail(string? email)
        {
            if (string.IsNullOrWhiteSpace(email))
            {
                return null;
            }

            return email.Trim().ToLowerInvariant();
        }

    }
}
