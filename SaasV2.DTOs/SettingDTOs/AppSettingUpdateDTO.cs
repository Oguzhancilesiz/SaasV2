using System;
using System.Collections.Generic;

namespace SaasV2.DTOs.SettingDTOs
{
    public class AppSettingUpdateDTO
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
    }

    public class AppSettingsBatchUpdateDTO
    {
        public string Category { get; set; } = string.Empty;
        public Dictionary<string, string> Settings { get; set; } = new();
    }
}

