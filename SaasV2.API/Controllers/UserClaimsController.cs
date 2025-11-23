using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.UserDTOs;
using SaasV2.Services.Concrete;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/user-claims")]
[AdminAuthorize]
public class UserClaimsController : ControllerBase
{
    private readonly UserClaimService _service;
    public UserClaimsController(UserClaimService service) => _service = service;

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<List<UserClaimDTO>>> GetByUser(Guid userId)
    {
        var claims = await _service.GetUserClaimsAsync(userId);
        return Ok(claims);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UserClaimAddDTO dto)
    {
        await _service.AddUserClaimAsync(dto);
        return StatusCode(201);
    }

    [HttpDelete("user/{userId:guid}")]
    public async Task<IActionResult> Delete(Guid userId, [FromQuery] string claimType, [FromQuery] string claimValue)
    {
        await _service.RemoveUserClaimAsync(userId, claimType, claimValue);
        return NoContent();
    }
}

