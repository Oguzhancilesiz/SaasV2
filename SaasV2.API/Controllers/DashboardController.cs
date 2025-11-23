using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.DashboardDTOs;
using SaasV2.Services.Abstracts;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[AdminAuthorize]
public class DashboardController : ControllerBase
{
    private readonly IDashboardService _service;
    
    public DashboardController(IDashboardService service)
    {
        _service = service;
    }

    [HttpGet("global")]
    public async Task<ActionResult<GlobalDashboardDTO>> GetGlobal()
    {
        var result = await _service.GetGlobalDashboardAsync();
        return Ok(result);
    }

    [HttpGet("user/{userId:guid}")]
    public async Task<ActionResult<UserDashboardDTO>> GetUser(Guid userId)
    {
        var result = await _service.GetUserDashboardAsync(userId);
        return Ok(result);
    }

    [HttpGet("user/by-email/{email}")]
    public async Task<ActionResult<UserDashboardDTO>> GetUserByEmail(string email)
    {
        var result = await _service.GetUserDashboardByEmailAsync(email);
        return Ok(result);
    }

    [HttpGet("app/{appId:guid}")]
    public async Task<ActionResult<AppDashboardDTO>> GetAppDashboard(Guid appId)
    {
        var result = await _service.GetAppDashboardAsync(appId);
        return Ok(result);
    }
}
