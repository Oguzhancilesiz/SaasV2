using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.OutboxDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/outbox")]
[AdminAuthorize]
public class OutboxController : ControllerBase
{
    private readonly IOutboxService _service;
    public OutboxController(IOutboxService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<OutboxMessageDTO>>> GetAll(
        [FromQuery] Guid? appId = null,
        [FromQuery] string? type = null,
        [FromQuery] bool? pending = null)
    {
        var all = await _service.GetAll();
        
        if (appId.HasValue && appId.Value != Guid.Empty)
            all = all.Where(x => x.AppId == appId.Value).ToList();
        
        if (!string.IsNullOrWhiteSpace(type))
            all = all.Where(x => x.Type == type).ToList();
        
        if (pending.HasValue)
        {
            if (pending.Value)
                all = all.Where(x => x.ProcessedAt == null).ToList();
            else
                all = all.Where(x => x.ProcessedAt != null).ToList();
        }
        
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OutboxMessageDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("pending")]
    public async Task<ActionResult<List<OutboxMessageDTO>>> GetPending([FromQuery] int take = 100, [FromQuery] DateTime? olderThanUtc = null)
    {
        var pending = await _service.GetPendingAsync(take, olderThanUtc);
        return Ok(pending);
    }

    [HttpPost]
    public async Task<ActionResult<OutboxMessageDTO>> Create([FromBody] OutboxMessageAddDTO dto)
    {
        var result = await _service.EnqueueAsync(dto);
        return StatusCode(201, result);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] OutboxMessageUpdateDTO dto)
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

    [HttpPost("{id:guid}/mark-processed")]
    public async Task<IActionResult> MarkProcessed(Guid id, [FromQuery] DateTime? processedAtUtc = null)
    {
        await _service.MarkProcessedAsync(id, processedAtUtc);
        return NoContent();
    }

    [HttpPost("{id:guid}/increment-retry")]
    public async Task<ActionResult<int>> IncrementRetry(Guid id)
    {
        var retries = await _service.IncrementRetryAsync(id);
        return Ok(retries);
    }

    [HttpPost("cleanup-processed")]
    public async Task<ActionResult<int>> CleanupProcessed([FromQuery] DateTime olderThanUtc)
    {
        var count = await _service.CleanupProcessedAsync(olderThanUtc);
        return Ok(count);
    }
}

