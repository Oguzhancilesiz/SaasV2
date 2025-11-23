using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.WebhookDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/webhook-endpoints")]
[AdminAuthorize]
public class WebhookEndpointsController : ControllerBase
{
    private readonly IWebhookEndpointService _service;
    public WebhookEndpointsController(IWebhookEndpointService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<WebhookEndpointDTO>>> GetAll([FromQuery] Guid? appId = null)
    {
        if (appId.HasValue && appId.Value != Guid.Empty)
        {
            return Ok(await _service.GetByAppAsync(appId.Value));
        }
        return Ok(await _service.GetAll());
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WebhookEndpointDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("active/{appId:guid}/{eventType}")]
    public async Task<ActionResult<List<WebhookEndpointDTO>>> GetActive(Guid appId, string eventType)
        => Ok(await _service.GetActiveByAppAndEventAsync(appId, eventType));

    [HttpPost]
    public async Task<ActionResult<WebhookEndpointDTO>> Create([FromBody] WebhookEndpointAddDTO dto)
    {
        await _service.Add(dto);
        // Get the created endpoint - we need to find it by some unique property
        var byApp = await _service.GetByAppAsync(dto.AppId);
        var created = byApp.OrderByDescending(x => x.CreatedDate).FirstOrDefault();
        if (created == null) return BadRequest("Webhook endpoint oluşturulamadı.");
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] WebhookEndpointUpdateDTO dto)
    {
        if (id != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.Update(dto);
        return NoContent();
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        await _service.ActivateAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id)
    {
        await _service.DeactivateAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/rotate-secret")]
    public async Task<IActionResult> RotateSecret(Guid id)
    {
        await _service.RotateSecretAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/test-ping")]
    public async Task<ActionResult<WebhookEndpointDTO>> TestPing(Guid id)
    {
        var result = await _service.TestPingAsync(id);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.Delete(id);
        return NoContent();
    }
}

