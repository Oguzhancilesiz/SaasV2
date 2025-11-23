using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.WebhookDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/webhook-deliveries")]
[AdminAuthorize]
public class WebhookDeliveriesController : ControllerBase
{
    private readonly IWebhookDeliveryService _service;
    public WebhookDeliveriesController(IWebhookDeliveryService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<WebhookDeliveryDTO>>> GetAll([FromQuery] Guid? webhookEndpointId = null, [FromQuery] string? eventType = null)
    {
        var all = await _service.GetAll();
        
        if (webhookEndpointId.HasValue && webhookEndpointId.Value != Guid.Empty)
            all = all.Where(x => x.WebhookEndpointId == webhookEndpointId.Value).ToList();
        
        if (!string.IsNullOrWhiteSpace(eventType))
            all = all.Where(x => x.EventType == eventType).ToList();
        
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WebhookDeliveryDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpPost]
    public async Task<ActionResult<WebhookDeliveryDTO>> Create([FromBody] WebhookDeliveryAddDTO dto)
    {
        await _service.Add(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] WebhookDeliveryUpdateDTO dto)
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

    [HttpPost("{endpointId:guid}/retry-failed")]
    public async Task<ActionResult<int>> RetryFailed(Guid endpointId, [FromQuery] int maxAttempts = 3)
    {
        var count = await _service.RetryFailedAsync(endpointId, maxAttempts);
        return Ok(count);
    }
}

