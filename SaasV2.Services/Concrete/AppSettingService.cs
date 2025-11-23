using Mapster;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SaasV2.Core.Abstracts;
using SaasV2.DAL;
using SaasV2.DTOs.SettingDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SaasV2.Services.Concrete
{
    public class AppSettingService : IAppSettingService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<AppSetting> _repo;
        private readonly IConfiguration _configuration;

        public AppSettingService(IUnitOfWork uow, IConfiguration configuration)
        {
            _uow = uow;
            _repo = _uow.Repository<AppSetting>();
            _configuration = configuration;
        }

        public async Task<List<AppSettingDTO>> GetAll()
        {
            var q = await _repo.GetAllActives();
            var settings = await q
                .AsNoTracking()
                .OrderBy(x => x.Category)
                .ThenBy(x => x.Key)
                .ToListAsync();

            return settings.Adapt<List<AppSettingDTO>>();
        }

        public async Task<AppSettingDTO?> GetByKey(string key)
        {
            var q = await _repo.GetBy(x => x.Key == key && x.Status == Core.Enums.Status.Active);
            var setting = await q.AsNoTracking().FirstOrDefaultAsync();
            return setting?.Adapt<AppSettingDTO>();
        }

        public async Task<List<AppSettingDTO>> GetByCategory(string category)
        {
            var q = await _repo.GetBy(x => x.Category == category && x.Status == Core.Enums.Status.Active);
            var settings = await q
                .AsNoTracking()
                .OrderBy(x => x.Key)
                .ToListAsync();

            return settings.Adapt<List<AppSettingDTO>>();
        }

        public async Task<string?> GetValue(string key)
        {
            var setting = await GetByKey(key);
            return setting?.Value;
        }

        public async Task<T?> GetValue<T>(string key) where T : struct
        {
            var value = await GetValue(key);
            if (string.IsNullOrEmpty(value)) return null;

            try
            {
                return (T)Convert.ChangeType(value, typeof(T));
            }
            catch
            {
                return null;
            }
        }

        public async Task Update(string key, string value)
        {
            var q = await _repo.GetBy(x => x.Key == key);
            var setting = await q.FirstOrDefaultAsync();

            if (setting == null)
            {
                // Yeni setting oluştur
                setting = new AppSetting
                {
                    Id = Guid.NewGuid(),
                    Key = key,
                    Value = value,
                    Status = Core.Enums.Status.Active,
                    CreatedDate = DateTime.UtcNow,
                    ModifiedDate = DateTime.UtcNow,
                };
                await _repo.AddAsync(setting);
            }
            else
            {
                setting.Value = value;
                setting.ModifiedDate = DateTime.UtcNow;
                await _repo.Update(setting);
            }

            await _uow.SaveChangesAsync();
        }

        public async Task UpdateBatch(AppSettingsBatchUpdateDTO dto)
        {
            foreach (var kvp in dto.Settings)
            {
                await Update(kvp.Key, kvp.Value);
            }
        }

        public async Task<string> GetConnectionStringMasked()
        {
            var connStr = _configuration.GetConnectionString("dbCon") ?? "";
            
            // Mask the connection string for security
            if (string.IsNullOrEmpty(connStr)) return "Not configured";

            var parts = connStr.Split(';');
            var masked = parts.Select(part =>
            {
                if (part.StartsWith("Server=", StringComparison.OrdinalIgnoreCase))
                {
                    var server = part.Substring(7);
                    var maskedServer = server.Length > 3 ? server.Substring(0, 3) + ".***" : "***";
                    return $"Server={maskedServer}";
                }
                if (part.StartsWith("Database=", StringComparison.OrdinalIgnoreCase))
                {
                    return "Database=***";
                }
                if (part.StartsWith("User Id=", StringComparison.OrdinalIgnoreCase) || 
                    part.StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
                {
                    return "***";
                }
                return part;
            });

            return string.Join(";", masked);
        }

        public async Task<bool> TestDatabaseConnection()
        {
            try
            {
                // BaseContext'i almak için IUnitOfWork'ten Context property'sini kullan
                var context = _uow.Context as BaseContext;
                if (context == null) return false;

                return await context.Database.CanConnectAsync();
            }
            catch
            {
                return false;
            }
        }
    }
}

