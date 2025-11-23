using SaasV2.DTOs.UserDTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SaasV2.Services.Abstracts
{
    public interface IUserService
    {
        Task Login(LoginDTO login);
        Task Register(RegisterDTO register);
        Task AddUserInRole(Guid userId, List<string> roles);
        Task<List<UserDTO>> GetAllUser();
        Task DeleteUser(Guid userId);
        Task UnApprovedUser(Guid userId);
        Task ActiveUser(Guid userId);
        Task SignOut();
        Task<UserDTO> GetById(Guid userId);
        Task<UserDTO> GetByName(string userName);
        Task<List<string>> GetRolesByUserId(Guid userId);
    }
}
