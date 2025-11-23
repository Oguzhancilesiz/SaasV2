using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.ApiKeyDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/apikeys")]
[AdminAuthorize]
public class ApiKeysController : ControllerBase
{
    private readonly IApiKeyService _service;
    public ApiKeysController(IApiKeyService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ApiKeyDTO>>> GetAll([FromQuery] Guid? appId = null, [FromQuery] bool includeExpired = false, [FromQuery] bool includeDeleted = false)
    {
        if (appId.HasValue && appId.Value != Guid.Empty)
        {
            return Ok(await _service.GetByAppAsync(appId.Value, includeExpired, includeDeleted));
        }
        var all = await _service.GetAll();
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApiKeyDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-prefix/{appId:guid}/{prefix}")]
    public async Task<ActionResult<ApiKeyDTO>> GetByPrefix(Guid appId, string prefix) 
        => Ok(await _service.GetByPrefixAsync(appId, prefix));

    [HttpPost]
    public async Task<ActionResult<ApiKeyDTO>> Create([FromBody] ApiKeyAddDTO dto)
    {
        await _service.Add(dto);
        var created = await _service.GetByPrefixAsync(dto.AppId, dto.Prefix);
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ApiKeyUpdateDTO dto)
    {
        if (id != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.Update(dto);
        return NoContent();
    }

    [HttpPost("{id:guid}/revoke")]
    public async Task<IActionResult> Revoke(Guid id)
    {
        await _service.RevokeAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/touch")]
    public async Task<IActionResult> Touch(Guid id)
    {
        await _service.TouchLastUsedAsync(id);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.Delete(id);
        return NoContent();
    }
}

