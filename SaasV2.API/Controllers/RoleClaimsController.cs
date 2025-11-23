using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.RoleDTOs;
using SaasV2.Services.Concrete;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/role-claims")]
[AdminAuthorize]
public class RoleClaimsController : ControllerBase
{
    private readonly RoleClaimService _service;
    public RoleClaimsController(RoleClaimService service) => _service = service;

    [HttpGet("role/{roleId:guid}")]
    public async Task<ActionResult<List<RoleClaimDTO>>> GetByRole(Guid roleId)
    {
        var claims = await _service.GetRoleClaimsAsync(roleId);
        return Ok(claims);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RoleClaimAddDTO dto)
    {
        await _service.AddRoleClaimAsync(dto);
        return StatusCode(201);
    }

    [HttpDelete("role/{roleId:guid}")]
    public async Task<IActionResult> Delete(Guid roleId, [FromQuery] string claimType, [FromQuery] string claimValue)
    {
        await _service.RemoveRoleClaimAsync(roleId, claimType, claimValue);
        return NoContent();
    }
}

