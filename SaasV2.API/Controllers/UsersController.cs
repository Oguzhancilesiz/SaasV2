using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/users")]
[AdminAuthorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _service;
    public UsersController(IUserService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<UserDTO>>> GetAll() => Ok(await _service.GetAllUser());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-name/{userName}")]
    public async Task<ActionResult<UserDTO>> GetByName(string userName) => Ok(await _service.GetByName(userName));

    [HttpGet("{id:guid}/roles")]
    public async Task<ActionResult<List<string>>> GetRoles(Guid id) => Ok(await _service.GetRolesByUserId(id));

    [HttpPost("{id:guid}/roles")]
    public async Task<IActionResult> AddRoles(Guid id, [FromBody] List<string> roles)
    {
        await _service.AddUserInRole(id, roles);
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        await _service.ActiveUser(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/unapprove")]
    public async Task<IActionResult> Unapprove(Guid id)
    {
        await _service.UnApprovedUser(id);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteUser(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/user-roles")]
    public async Task<ActionResult<List<UserRoleDTO>>> GetUserRoles(Guid id)
    {
        var roles = await _service.GetRolesByUserId(id);
        // Bu endpoint'i genişletebiliriz, şimdilik sadece rol isimlerini döndürüyoruz
        return Ok(roles.Select(r => new UserRoleDTO
        {
            UserId = id,
            RoleName = r
        }).ToList());
    }
}

