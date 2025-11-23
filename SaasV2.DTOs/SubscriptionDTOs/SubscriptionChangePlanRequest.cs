namespace SaasV2.DTOs.SubscriptionDTOs
{
    public class SubscriptionChangePlanRequest
    {
        public Guid NewPlanId { get; set; }
        public string? Reason { get; set; }
    }
}

