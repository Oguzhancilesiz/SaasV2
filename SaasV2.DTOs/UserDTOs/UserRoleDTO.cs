using System;

namespace SaasV2.DTOs.UserDTOs
{
    public class UserRoleDTO
    {
        public Guid UserId { get; set; }
        public Guid RoleId { get; set; }
        public string UserName { get; set; }
        public string RoleName { get; set; }
    }
}

