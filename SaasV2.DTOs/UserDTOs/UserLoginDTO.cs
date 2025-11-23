using System;

namespace SaasV2.DTOs.UserDTOs
{
    public class UserLoginDTO
    {
        public string LoginProvider { get; set; }
        public string ProviderKey { get; set; }
        public string ProviderDisplayName { get; set; }
        public Guid UserId { get; set; }
    }
}

