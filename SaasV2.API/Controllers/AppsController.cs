using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.AppDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/apps")]
[AdminAuthorize]
public class AppsController : ControllerBase
{
    private readonly IAppService _service;
    private readonly IAppCompositeService _composite;
    public AppsController(IAppService service, IAppCompositeService composite)
    {
        _service = service;
        _composite = composite;
    }

    [HttpGet]
    public async Task<ActionResult<List<AppDTO>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet("filtered")]
    public async Task<ActionResult<AppFilterResponse>> GetFiltered([FromQuery] AppFilterRequest request)
    {
        var result = await _service.GetFilteredAsync(request);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<AppDTO>> GetByCode(string code) => Ok(await _service.GetByCodeAsync(code));

    [HttpPost]
    public async Task<ActionResult<AppDTO>> Create([FromBody] AppAddDTO dto)
    {
        await _service.Add(dto);
        // Code benzersiz olduğundan geri alıp Created dönüyoruz
        var created = await _service.GetByCodeAsync(dto.Code);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AppUpdateDTO dto)
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



    [HttpGet("{id:guid}/dashboard")]
    public async Task<ActionResult<AppDashboardSummaryDTO>> Dashboard(Guid id)
    => Ok(await _composite.GetAppDashboardAsync(id));

    public class DashboardBatchRequest { public List<Guid> Ids { get; set; } = []; }

    [HttpPost("dashboard/batch")]
    public async Task<ActionResult<List<AppDashboardSummaryDTO>>> DashboardBatch([FromBody] DashboardBatchRequest req)
        => Ok(await _composite.GetAppDashboardBatchAsync(req.Ids));

    [HttpPost("provision")]
    public async Task<ActionResult<AppProvisionResult>> Provision([FromBody] AppProvisionRequest req)
    {
        var result = await _composite.ProvisionAsync(req);
        return CreatedAtAction(nameof(Get), new { id = result.AppId }, result);
    }

}
