// FeatureAddDTO.cs (sende zaten vardı, uyumlu)
namespace SaasV2.DTOs.FeatureDTOs
{
    public class FeatureAddDTO
    {
        public Guid AppId { get; set; }
        public string Key { get; set; }
        public string Name { get; set; }
        public string Unit { get; set; }
        public string Description { get; set; }
    }
}
