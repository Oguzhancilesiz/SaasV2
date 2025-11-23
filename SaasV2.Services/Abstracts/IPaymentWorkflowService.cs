using SaasV2.DTOs.InvoiceDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IPaymentWorkflowService
    {
        Task<InvoiceDTO> ProcessInvoiceAsync(Guid invoiceId, CancellationToken cancellationToken = default);
        Task<List<InvoicePaymentAttemptDTO>> GetAttemptsAsync(Guid invoiceId);
        Task<InvoiceDTO> RetryInvoiceAsync(Guid invoiceId, bool force = false, CancellationToken cancellationToken = default);
        Task<InvoiceDTO> CancelInvoiceAsync(Guid invoiceId, string? reason = null, CancellationToken cancellationToken = default);
    }
}

