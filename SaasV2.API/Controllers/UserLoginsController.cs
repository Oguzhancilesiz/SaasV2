using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Services.Concrete;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/user-logins")]
[AdminAuthorize]
public class UserLoginsController : ControllerBase
{
    private readonly UserLoginService _service;
    public UserLoginsController(UserLoginService service) => _service = service;

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<List<UserLoginDTO>>> GetByUser(Guid userId)
    {
        var logins = await _service.GetUserLoginsAsync(userId);
        return Ok(logins);
    }

    [HttpDelete("user/{userId:guid}")]
    public async Task<IActionResult> Delete(Guid userId, [FromQuery] string loginProvider, [FromQuery] string providerKey)
    {
        await _service.RemoveUserLoginAsync(userId, loginProvider, providerKey);
        return NoContent();
    }
}

