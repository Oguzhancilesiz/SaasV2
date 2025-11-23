namespace SaasV2.DTOs.SubscriptionDTOs
{
    public class SubscriptionCancelRequest
    {
        public DateTime? EndAt { get; set; }
        public string? Reason { get; set; }
    }
}

