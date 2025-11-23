using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.FeatureDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/features")]
[AdminAuthorize]
public class FeaturesController : ControllerBase
{
    private readonly IFeatureService _service;
    public FeaturesController(IFeatureService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<FeatureDTO>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FeatureDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-app/{appId:guid}")]
    public async Task<ActionResult<List<FeatureDTO>>> GetByApp(Guid appId) 
        => Ok(await _service.GetByAppAsync(appId));

    [HttpPost]
    public async Task<ActionResult<FeatureDTO>> Create([FromBody] FeatureAddDTO dto)
    {
        await _service.Add(dto);
        // Name/Key ile tekrar listelemektense sade dönüş
        return StatusCode(201);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] FeatureUpdateDTO dto)
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
