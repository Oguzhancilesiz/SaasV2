using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.UsageRecordDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/usage-records")]
[ApiKeyOrAdminAuthorize]
public class UsageRecordsController : ControllerBase
{
    private readonly IUsageRecordService _service;
    public UsageRecordsController(IUsageRecordService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<UsageRecordDTO>>> GetAll([FromQuery] Guid? appId = null, [FromQuery] Guid? userId = null, [FromQuery] Guid? featureId = null)
    {
        var all = await _service.GetAll();
        
        if (appId.HasValue && appId.Value != Guid.Empty)
            all = all.Where(x => x.AppId == appId.Value).ToList();
        
        if (userId.HasValue && userId.Value != Guid.Empty)
            all = all.Where(x => x.UserId == userId.Value).ToList();
        
        if (featureId.HasValue && featureId.Value != Guid.Empty)
            all = all.Where(x => x.FeatureId == featureId.Value).ToList();
        
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UsageRecordDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpPost]
    public async Task<ActionResult<UsageRecordDTO>> Create([FromBody] UsageRecordAddDTO dto)
    {
        await _service.Add(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UsageRecordUpdateDTO dto)
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

    [HttpGet("recent/{appId:guid}/{userId:guid}")]
    public async Task<ActionResult<List<UsageRecordDTO>>> GetRecent(Guid appId, Guid userId, [FromQuery] int take = 100)
    {
        var recent = await _service.GetRecentAsync(appId, userId, take);
        return Ok(recent);
    }
}

