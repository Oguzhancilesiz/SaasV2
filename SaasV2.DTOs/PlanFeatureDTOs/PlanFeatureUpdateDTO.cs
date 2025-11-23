using SaasV2.Core.Enums;
using System;

namespace SaasV2.DTOs.PlanFeatureDTOs
{
    public class PlanFeatureUpdateDTO
    {
        public Guid Id { get; set; }

        // Not: Serviste Guid.Empty gelirse mevcut değer korunuyor.
        public Guid PlanId { get; set; }       // optional: değiştirmek istemiyorsan Guid.Empty gönder
        public Guid FeatureId { get; set; }    // optional: değiştirmek istemiyorsan Guid.Empty gönder

        public decimal? Limit { get; set; }
        public ResetInterval ResetInterval { get; set; }
        public bool AllowOverage { get; set; }
        public decimal? OverusePrice { get; set; }
    }
}
