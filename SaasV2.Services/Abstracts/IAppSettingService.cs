using SaasV2.DTOs.SettingDTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SaasV2.Services.Abstracts
{
    public interface IAppSettingService
    {
        Task<List<AppSettingDTO>> GetAll();
        Task<AppSettingDTO?> GetByKey(string key);
        Task<List<AppSettingDTO>> GetByCategory(string category);
        Task<string?> GetValue(string key);
        Task<T?> GetValue<T>(string key) where T : struct;
        Task Update(string key, string value);
        Task UpdateBatch(AppSettingsBatchUpdateDTO dto);
        Task<string> GetConnectionStringMasked();
        Task<bool> TestDatabaseConnection();
    }
}








