using System;

namespace SaasV2.DTOs.RoleDTOs
{
    public class RoleClaimDTO
    {
        public int Id { get; set; }
        public Guid RoleId { get; set; }
        public string ClaimType { get; set; }
        public string ClaimValue { get; set; }
    }

    public class RoleClaimAddDTO
    {
        public Guid RoleId { get; set; }
        public string ClaimType { get; set; }
        public string ClaimValue { get; set; }
    }
}

