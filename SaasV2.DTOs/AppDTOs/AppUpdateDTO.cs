using SaasV2.Core.Enums;

namespace SaasV2.DTOs.AppDTOs
{
    public class AppUpdateDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Code { get; set; }
        public string Description { get; set; }
        public Guid? OwnerUserId { get; set; }
        public AppEnvironment Environment { get; set; } = AppEnvironment.Production;
        public string? WorkspaceKey { get; set; }
        public string? OwnerContactEmail { get; set; }
        public string? BillingContactEmail { get; set; }
        public string? Notes { get; set; }
    }
}
