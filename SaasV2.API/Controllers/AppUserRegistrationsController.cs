using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.AppUserRegistrationDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/app-user-registrations")]
[ApiKeyOrAdminAuthorize]
public class AppUserRegistrationsController : ControllerBase
{
    private readonly IAppUserRegistrationService _service;
    public AppUserRegistrationsController(IAppUserRegistrationService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<AppUserRegistrationDTO>>> GetAll([FromQuery] Guid? appId = null, [FromQuery] Guid? userId = null)
    {
        var all = await _service.GetAll();
        
        if (appId.HasValue && appId.Value != Guid.Empty)
            all = all.Where(x => x.AppId == appId.Value).ToList();
        
        if (userId.HasValue && userId.Value != Guid.Empty)
            all = all.Where(x => x.UserId == userId.Value).ToList();
        
        return Ok(all);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AppUserRegistrationDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpPost]
    public async Task<ActionResult<AppUserRegistrationDTO>> Create([FromBody] AppUserRegistrationAddDTO dto)
    {
        await _service.Add(dto);
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] AppUserRegistrationUpdateDTO dto)
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

