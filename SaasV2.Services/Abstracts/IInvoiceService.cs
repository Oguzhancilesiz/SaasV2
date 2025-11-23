// IInvoiceService.cs
using SaasV2.DTOs.InvoiceDTOs;

namespace SaasV2.Services.Abstracts
{
    public interface IInvoiceService : IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>
    {
        // Header odaklı
        Task<List<InvoiceDTO>> GetByUserAsync(Guid userId, DateTime? periodStart = null, DateTime? periodEnd = null);
        Task<List<InvoiceDTO>> GetByAppAsync(Guid appId, DateTime? periodStart = null, DateTime? periodEnd = null);
        Task RecalculateTotalsAsync(Guid invoiceId);         // satırlardan totals yeniden hesapla

        // Lines
        Task<List<InvoiceLineDTO>> GetLinesAsync(Guid invoiceId);
        Task<InvoiceLineDTO> AddLineAsync(InvoiceLineAddDTO dto);
        Task UpdateLineAsync(InvoiceLineUpdateDTO dto);
        Task DeleteLineAsync(Guid lineId);

        // Şık: toplu satır ekleme
        Task<List<InvoiceLineDTO>> AddLinesAsync(IEnumerable<InvoiceLineAddDTO> lines);
    }
}
