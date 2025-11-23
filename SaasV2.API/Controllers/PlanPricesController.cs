using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.PlanPriceDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/plan-prices")]
[ApiKeyOrAdminAuthorize]
public class PlanPricesController : ControllerBase
{
    private readonly IPlanPriceService _service;
    public PlanPricesController(IPlanPriceService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<PlanPriceDTO>>> GetAll([FromQuery] Guid? planId = null)
    {
        var all = await _service.GetAll();
        if (planId is null || planId == Guid.Empty) return Ok(all);
        return Ok(all.Where(x => x.PlanId == planId.Value).ToList());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlanPriceDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] PlanPriceAddDTO dto)
    {
        await _service.Add(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] PlanPriceUpdateDTO dto)
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
