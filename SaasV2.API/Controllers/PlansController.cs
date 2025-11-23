using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.PlanDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/plans")]
[ApiKeyOrAdminAuthorize]
public class PlansController : ControllerBase
{
    private readonly IPlanService _service;
    public PlansController(IPlanService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<PlanDTO>>> GetAll([FromQuery] Guid? appId = null)
    {
        if (appId.HasValue && appId.Value != Guid.Empty)
        {
            var plans = await _service.GetByAppIdAsync(appId.Value);
            return Ok(plans);
        }
        return Ok(await _service.GetAll());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-code/{appId:guid}/{code}")]
    public async Task<ActionResult<PlanDTO>> GetByCode(Guid appId, string code) 
        => Ok(await _service.GetByCodeAsync(appId, code));

    [HttpPost]
    public async Task<ActionResult<PlanDTO>> Create([FromBody] PlanAddDTO dto)
    {
        await _service.Add(dto);
        var created = await _service.GetByCodeAsync(dto.AppId, dto.Code);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PlanUpdateDTO dto)
    {
        if (id != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.Update(dto);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.Delete(id);
        return NoContent();
    }

    [HttpPatch("{id:guid}/toggle-visibility")]
    public async Task<IActionResult> ToggleVisibility(Guid id, [FromBody] bool isPublic)
    {
        await _service.ToggleVisibilityAsync(id, isPublic);
        return NoContent();
    }

    [HttpPatch("{id:guid}/set-free")]
    public async Task<IActionResult> SetFree(Guid id, [FromBody] bool isFree)
    {
        await _service.SetFreeAsync(id, isFree);
        return NoContent();
    }
}
