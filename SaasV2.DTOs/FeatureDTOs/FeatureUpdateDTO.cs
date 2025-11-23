// FeatureUpdateDTO.cs (AppId eklendi, Code-first yönetiminde bazen gerekebilir)
namespace SaasV2.DTOs.FeatureDTOs
{
    public class FeatureUpdateDTO
    {
        public Guid Id { get; set; }
        public Guid AppId { get; set; }      // farklı app'e taşıma ihtimali için dursun
        public string Key { get; set; }
        public string Name { get; set; }
        public string Unit { get; set; }
        public string Description { get; set; }
    }
}
