using SaasV2.Core.Abstracts;

namespace SaasV2.Entity
{
    public class AppSetting : BaseEntity
    {
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Category { get; set; } = "General"; // General, System, Security, API, Database
    }
}








