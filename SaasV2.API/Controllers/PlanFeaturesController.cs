using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.PlanFeatureDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/plan-features")]
[AdminAuthorize]
public class PlanFeaturesController : ControllerBase
{
    private readonly IPlanFeatureService _service;
    public PlanFeaturesController(IPlanFeatureService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<PlanFeatureDTO>>> GetAll([FromQuery] Guid? planId = null, [FromQuery] Guid? featureId = null)
    {
        var all = await _service.GetAll();
        if (planId is { } p && p != Guid.Empty) all = all.Where(x => x.PlanId == p).ToList();
        if (featureId is { } f && f != Guid.Empty) all = all.Where(x => x.FeatureId == f).ToList();
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanFeatureDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PlanFeatureAddDTO dto)
    {
        await _service.Add(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PlanFeatureUpdateDTO dto)
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
}
