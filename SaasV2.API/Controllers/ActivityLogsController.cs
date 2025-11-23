using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.ActivityLogDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/activity-logs")]
[AdminAuthorize]
public class ActivityLogsController : ControllerBase
{
    private readonly IActivityLogService _service;
    public ActivityLogsController(IActivityLogService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ActivityLogDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-user/{userId:guid}")]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetByUser(Guid userId) => Ok(await _service.GetByUser(userId));

    [HttpGet("by-app/{appId:guid}")]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetByApp(Guid appId) => Ok(await _service.GetByApp(appId));

    [HttpGet("by-entity/{entityType}")]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetByEntity(string entityType, [FromQuery] Guid? entityId = null)
        => Ok(await _service.GetByEntity(entityType, entityId));

    [HttpGet("by-action/{action}")]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetByAction(string action) => Ok(await _service.GetByAction(action));

    [HttpGet("recent")]
    public async Task<ActionResult<List<ActivityLogDTO>>> GetRecent([FromQuery] int take = 100) => Ok(await _service.GetRecent(take));
}

