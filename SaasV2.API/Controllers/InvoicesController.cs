using Microsoft.AspNetCore.Mvc;
using SaasV2.API.Infrastructure;
using SaasV2.DTOs.InvoiceDTOs;
using SaasV2.Services.Abstracts;
using System.Threading;

namespace SaasV2.API.Controllers;

[ApiController]
[Route("api/invoices")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _service;
    private readonly IPaymentWorkflowService _paymentWorkflow;

    public InvoicesController(IInvoiceService service, IPaymentWorkflowService paymentWorkflow)
    {
        _service = service;
        _paymentWorkflow = paymentWorkflow;
    }

    [HttpGet]
    [AdminAuthorize]
    public async Task<ActionResult<List<InvoiceDTO>>> GetAll() => Ok(await _service.GetAll());

    [HttpGet("{id:guid}")]
    [AdminAuthorize]
    public async Task<ActionResult<InvoiceDTO>> Get(Guid id) => Ok(await _service.GetById(id));

    [HttpGet("by-user/{userId:guid}")]
    [ApiKeyOrAdminAuthorize]
    public async Task<ActionResult<List<InvoiceDTO>>> GetByUser(Guid userId, [FromQuery] DateTime? periodStart = null, [FromQuery] DateTime? periodEnd = null)
    {
        System.Diagnostics.Debug.WriteLine($"📄 GetByUser çağrıldı - UserId: {userId}, PeriodStart: {periodStart}, PeriodEnd: {periodEnd}");
        var result = await _service.GetByUserAsync(userId, periodStart, periodEnd);
        System.Diagnostics.Debug.WriteLine($"📄 GetByUser sonucu - Fatura sayısı: {result.Count}");
        return Ok(result);
    }

    [HttpGet("by-app/{appId:guid}")]
    [AdminAuthorize]
    public async Task<ActionResult<List<InvoiceDTO>>> GetByApp(Guid appId, [FromQuery] DateTime? periodStart = null, [FromQuery] DateTime? periodEnd = null)
        => Ok(await _service.GetByAppAsync(appId, periodStart, periodEnd));

    [HttpGet("{id:guid}/lines")]
    [ApiKeyOrAdminAuthorize]
    public async Task<ActionResult<List<InvoiceLineDTO>>> GetLines(Guid id) => Ok(await _service.GetLinesAsync(id));

    [HttpPost]
    [AdminAuthorize]
    public async Task<ActionResult<InvoiceDTO>> Create([FromBody] InvoiceAddDTO dto)
    {
        await _service.Add(dto);
        // Get the created invoice - we need to find it by some unique property
        // For now, return the first match or get all and find
        var all = await _service.GetAll();
        var created = all.OrderByDescending(x => x.CreatedDate).FirstOrDefault();
        if (created == null) return BadRequest("Invoice oluşturulamadı.");
        return CreatedAtAction(nameof(Get), new { id = created.Id }, created);
    }

    [HttpPut("{id:guid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] InvoiceUpdateDTO dto)
    {
        if (id != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.Update(dto);
        return NoContent();
    }

    [HttpPost("{id:guid}/recalculate")]
    [AdminAuthorize]
    public async Task<IActionResult> Recalculate(Guid id)
    {
        await _service.RecalculateTotalsAsync(id);
        return NoContent();
    }

    [HttpPost("{id:guid}/lines")]
    [AdminAuthorize]
    public async Task<ActionResult<List<InvoiceLineDTO>>> AddLines(Guid id, [FromBody] List<InvoiceLineAddDTO> lines)
    {
        var added = await _service.AddLinesAsync(lines);
        return Ok(added);
    }

    [HttpPut("lines/{lineId:guid}")]
    [AdminAuthorize]
    public async Task<IActionResult> UpdateLine(Guid lineId, [FromBody] InvoiceLineUpdateDTO dto)
    {
        if (lineId != dto.Id) return BadRequest("Route id ve body id eşleşmiyor.");
        await _service.UpdateLineAsync(dto);
        return NoContent();
    }

    [HttpDelete("lines/{lineId:guid}")]
    [AdminAuthorize]
    public async Task<IActionResult> DeleteLine(Guid lineId)
    {
        await _service.DeleteLineAsync(lineId);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [AdminAuthorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.Delete(id);
        return NoContent();
    }

    [HttpGet("{id:guid}/attempts")]
    [AdminAuthorize]
    public async Task<ActionResult<List<InvoicePaymentAttemptDTO>>> GetAttempts(Guid id)
        => Ok(await _paymentWorkflow.GetAttemptsAsync(id));

    [HttpPost("{id:guid}/retry")]
    [AdminAuthorize]
    public async Task<ActionResult<InvoiceDTO>> Retry(Guid id, [FromBody] InvoicePaymentRetryRequestDTO? request, CancellationToken cancellationToken)
    {
        var result = await _paymentWorkflow.RetryInvoiceAsync(id, request?.Force ?? false, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/cancel")]
    [AdminAuthorize]
    public async Task<ActionResult<InvoiceDTO>> Cancel(Guid id, [FromBody] InvoicePaymentCancelRequestDTO? request, CancellationToken cancellationToken)
    {
        var result = await _paymentWorkflow.CancelInvoiceAsync(id, request?.Reason, cancellationToken);
        return Ok(result);
    }
}

