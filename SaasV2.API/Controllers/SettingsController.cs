using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.SettingDTOs;
using SaasV2.Services.Abstracts;
using System.Threading.Tasks;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/settings")]
[AdminAuthorize]
public class SettingsController : ControllerBase
{
    private readonly IAppSettingService _service;

    public SettingsController(IAppSettingService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<ActionResult<List<AppSettingDTO>>> GetAll()
    {
        return Ok(await _service.GetAll());
    }

    [HttpGet("category/{category}")]
    public async Task<ActionResult<List<AppSettingDTO>>> GetByCategory(string category)
    {
        return Ok(await _service.GetByCategory(category));
    }

    [HttpGet("key/{key}")]
    public async Task<ActionResult<AppSettingDTO?>> GetByKey(string key)
    {
        var setting = await _service.GetByKey(key);
        if (setting == null) return NotFound();
        return Ok(setting);
    }

    [HttpPut("key/{key}")]
    public async Task<IActionResult> Update(string key, [FromBody] UpdateValueRequest request)
    {
        await _service.Update(key, request.Value);
        return NoContent();
    }

    [HttpPut("batch")]
    public async Task<IActionResult> UpdateBatch([FromBody] AppSettingsBatchUpdateDTO dto)
    {
        await _service.UpdateBatch(dto);
        return NoContent();
    }

    [HttpGet("database/connection-string")]
    public async Task<ActionResult<string>> GetConnectionStringMasked()
    {
        return Ok(await _service.GetConnectionStringMasked());
    }

    [HttpGet("database/test")]
    public async Task<ActionResult<bool>> TestDatabaseConnection()
    {
        var result = await _service.TestDatabaseConnection();
        return Ok(result);
    }
}

public class UpdateValueRequest
{
    public string Value { get; set; } = string.Empty;
}

