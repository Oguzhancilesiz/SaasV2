using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.SubscriptionDTOs;
using SaasV2.DTOs.SubscriptionItemDTOs;
using SaasV2.Services.Abstracts;
using System.Security.Claims;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/subscriptions")]
[ApiKeyOrAdminAuthorize]
public class SubscriptionsController : ControllerBase
{
    private readonly ISubscriptionService _service;
    public SubscriptionsController(ISubscriptionService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<SubscriptionDTO>>> GetAll([FromQuery] Guid? appId = null, [FromQuery] Guid? userId = null)
    {
        var all = await _service.GetAll();
        if (appId.HasValue && appId.Value != Guid.Empty)
            all = all.Where(x => x.AppId == appId.Value).ToList();
        if (userId.HasValue && userId.Value != Guid.Empty)
            all = all.Where(x => x.UserId == userId.Value).ToList();
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<SubscriptionDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("active/{appId:guid}/{userId:guid}")]
    public async Task<ActionResult<SubscriptionDTO>> GetActive(Guid appId, Guid userId)
    {
        var active = await _service.GetActiveAsync(appId, userId);
        if (active == null) return NotFound();
        return Ok(active);
    }

    [HttpGet("by-user/{userId:guid}")]
    public async Task<ActionResult<List<SubscriptionDTO>>> GetByUser(Guid userId) 
        => Ok(await _service.GetByUserAsync(userId));

    [HttpGet("by-app/{appId:guid}")]
    public async Task<ActionResult<List<SubscriptionDTO>>> GetByApp(Guid appId) 
        => Ok(await _service.GetByAppAsync(appId));

    [HttpPost]
    public async Task<ActionResult<SubscriptionDTO>> Start([FromBody] SubscriptionAddDTO dto)
    {
        var created = await _service.StartAsync(dto, GetUserId());
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] SubscriptionUpdateDTO dto)
    {
        if (id != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.Update(dto);
        return NoContent();
    }

    [HttpPost("{id:guid}/change-plan")]
    public async Task<ActionResult<SubscriptionDTO>> ChangePlan(Guid id, [FromBody] SubscriptionChangePlanRequest request)
    {
        if (request == null || request.NewPlanId == Guid.Empty)
        {
            return BadRequest("newPlanId zorunludur.");
        }

        var updated = await _service.ChangePlanAsync(id, request.NewPlanId, GetUserId(), request.Reason);
        return Ok(updated);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] SubscriptionCancelRequest request)
    {
        var endAt = request?.EndAt;
        await _service.CancelAsync(id, endAt, GetUserId(), request?.Reason);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.Delete(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/rebuild-items")]
    public async Task<IActionResult> RebuildItems(Guid id)
    {
        await _service.RebuildItemsFromPlanAsync(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/items")]
    public async Task<ActionResult<List<SubscriptionItemDTO>>> GetItems(Guid id)
        => Ok(await _service.GetItemsAsync(id));

    [HttpGet("{id:guid}/changes")]
    public async Task<ActionResult<List<SubscriptionChangeLogDTO>>> GetChanges(Guid id)
        => Ok(await _service.GetChangeHistoryAsync(id));

    private Guid? GetUserId()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userId, out var guid) ? guid : (Guid?)null;
    }
}

