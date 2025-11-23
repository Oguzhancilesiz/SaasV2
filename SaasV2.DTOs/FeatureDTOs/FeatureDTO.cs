// FeatureDTO.cs (AppId eklendi)
using SaasV2.Core.Enums;
using System;

namespace SaasV2.DTOs.FeatureDTOs
{
    public class FeatureDTO
    {
        public Guid Id { get; set; }
        public Status Status { get; set; }
        public DateTime CreatedDate { get; set; }
        public DateTime ModifiedDate { get; set; }
        public int AutoID { get; set; }

        public Guid AppId { get; set; }
        public string Key { get; set; }
        public string Name { get; set; }
        public string Unit { get; set; }
        public string Description { get; set; }
    }
}
