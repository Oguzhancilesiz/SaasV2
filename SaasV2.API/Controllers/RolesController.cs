using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.RoleDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/roles")]
[AdminAuthorize]
public class RolesController : ControllerBase
{
    private readonly IRoleService _service;
    public RolesController(IRoleService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<RoleDTO>>> GetAll() => Ok(await _service.GetRoles());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RoleDTO>> Get(Guid id)
    {
        var role = await _service.GetRole(id);
        if (role == null) return NotFound();
        return Ok(role);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] RoleAddDTO dto)
    {
        await _service.AddRole(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}/rename")]
    public async Task<IActionResult> Rename(Guid id, [FromBody] RenameRoleRequest request)
    {
        await _service.RenameRole(id, request.NewName);
        return NoContent();
    }

    [HttpPost("{id:guid}/restore")]
    public async Task<IActionResult> Restore(Guid id)
    {
        await _service.RestoreRole(id);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteRole(id);
        return NoContent();
    }
}

public class RenameRoleRequest
{
    public string NewName { get; set; }
}

