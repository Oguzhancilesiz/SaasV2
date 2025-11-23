using System;

namespace SaasV2.DTOs.UserDTOs
{
    public class UserClaimDTO
    {
        public int Id { get; set; }
        public Guid UserId { get; set; }
        public string ClaimType { get; set; }
        public string ClaimValue { get; set; }
    }

    public class UserClaimAddDTO
    {
        public Guid UserId { get; set; }
        public string ClaimType { get; set; }
        public string ClaimValue { get; set; }
    }
}

