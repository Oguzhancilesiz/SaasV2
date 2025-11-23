// InvoiceService.cs
using Mapster;
using Microsoft.EntityFrameworkCore;
using SaasV2.Core.Abstracts;
using SaasV2.Core.Enums;
using SaasV2.DTOs.InvoiceDTOs;
using SaasV2.Entity;
using SaasV2.Services.Abstracts;

namespace SaasV2.Services.Concrete
{
    public class InvoiceService : IInvoiceService
    {
        private readonly IUnitOfWork _uow;
        private readonly IBaseRepository<Invoice> _invoiceRepo;
        private readonly IBaseRepository<InvoiceLine> _lineRepo;

        public InvoiceService(IUnitOfWork uow)
        {
            _uow = uow;
            _invoiceRepo = _uow.Repository<Invoice>();
            _lineRepo = _uow.Repository<InvoiceLine>();
        }

        #region Invoice (Header)

        public async Task Add(InvoiceAddDTO dto)
        {
            ValidateHeader(dto.PeriodStart, dto.PeriodEnd);
            ValidateMoney(dto.Subtotal, dto.Tax, dto.Total);

            var now = DateTime.UtcNow;

            var entity = dto.Adapt<Invoice>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            entity.PaymentProvider = Normalize(entity.PaymentProvider);
            entity.PaymentReference = Normalize(entity.PaymentReference);
            entity.LastErrorCode = null;
            entity.LastErrorMessage = null;
            entity.PaymentAttemptCount = 0;
            entity.LastAttemptAt = null;
            entity.PaidAt = null;
            entity.FailedAt = null;

            await _invoiceRepo.AddAsync(entity);
            await _uow.SaveChangesAsync();
        }

        public async Task Update(InvoiceUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");
            ValidateMoney(dto.Subtotal, dto.Tax, dto.Total);

            var inv = await _invoiceRepo.GetById(dto.Id, ignoreQueryFilter: true)
                      ?? throw new KeyNotFoundException("Invoice bulunamadı.");

            // Not: Currency veya totals güncelleyeceksen guard’lar burada:
            inv = dto.Adapt(inv);
            inv.PaymentProvider = Normalize(inv.PaymentProvider);
            inv.PaymentReference = Normalize(inv.PaymentReference);
            inv.LastErrorCode = Normalize(inv.LastErrorCode);
            inv.LastErrorMessage = Normalize(inv.LastErrorMessage);
            inv.ModifiedDate = DateTime.UtcNow;

            await _invoiceRepo.Update(inv);
            await _uow.SaveChangesAsync();
        }

        public async Task Delete(Guid id)
        {
            var inv = await _invoiceRepo.GetById(id, ignoreQueryFilter: true)
                      ?? throw new KeyNotFoundException("Invoice bulunamadı.");

            // Header soft delete
            await _invoiceRepo.Delete(inv);

            // Satırları da soft delete etmek istersen (önerilir):
            var linesQ = await _lineRepo.GetBy(x => x.InvoiceId == id && x.Status != Status.Deleted);
            var lines = await linesQ.ToListAsync();
            foreach (var ln in lines) await _lineRepo.Delete(ln);

            await _uow.SaveChangesAsync();
        }

        public async Task<List<InvoiceDTO>> GetAll()
        {
            var q = await _invoiceRepo.GetAllActives();
            return await q.AsNoTracking()
                          .ProjectToType<InvoiceDTO>()
                          .ToListAsync();
        }

        public async Task<InvoiceDTO> GetById(Guid id)
        {
            var inv = await _invoiceRepo.GetById(id)
                      ?? throw new KeyNotFoundException("Invoice bulunamadı.");
            return inv.Adapt<InvoiceDTO>();
        }

        public async Task<List<InvoiceDTO>> GetByUserAsync(Guid userId, DateTime? periodStart = null, DateTime? periodEnd = null)
        {
            System.Diagnostics.Debug.WriteLine($"📄 InvoiceService.GetByUserAsync - UserId: {userId}");
            
            var q = await _invoiceRepo.GetBy(x => x.UserId == userId && x.Status != Status.Deleted);
            var countBeforeFilter = await q.CountAsync();
            System.Diagnostics.Debug.WriteLine($"📄 Fatura sayısı (Status.Deleted filtresi sonrası): {countBeforeFilter}");

            if (periodStart.HasValue) 
            {
                q = q.Where(x => x.PeriodEnd >= periodStart.Value);
                var countAfterPeriodStart = await q.CountAsync();
                System.Diagnostics.Debug.WriteLine($"📄 Fatura sayısı (PeriodStart filtresi sonrası): {countAfterPeriodStart}");
            }
            
            if (periodEnd.HasValue) 
            {
                q = q.Where(x => x.PeriodStart <= periodEnd.Value);
                var countAfterPeriodEnd = await q.CountAsync();
                System.Diagnostics.Debug.WriteLine($"📄 Fatura sayısı (PeriodEnd filtresi sonrası): {countAfterPeriodEnd}");
            }

            var result = await q.AsNoTracking()
                          .OrderByDescending(x => x.PeriodStart)
                          .ProjectToType<InvoiceDTO>()
                          .ToListAsync();
            
            System.Diagnostics.Debug.WriteLine($"📄 GetByUserAsync sonucu - Dönen fatura sayısı: {result.Count}");
            if (result.Count > 0)
            {
                System.Diagnostics.Debug.WriteLine($"📄 İlk fatura: Id={result[0].Id}, Total={result[0].Total}, Status={result[0].Status}");
            }

            return result;
        }

        public async Task<List<InvoiceDTO>> GetByAppAsync(Guid appId, DateTime? periodStart = null, DateTime? periodEnd = null)
        {
            var q = await _invoiceRepo.GetBy(x => x.AppId == appId && x.Status != Status.Deleted);

            if (periodStart.HasValue) q = q.Where(x => x.PeriodEnd >= periodStart.Value);
            if (periodEnd.HasValue) q = q.Where(x => x.PeriodStart <= periodEnd.Value);

            return await q.AsNoTracking()
                          .OrderByDescending(x => x.PeriodStart)
                          .ProjectToType<InvoiceDTO>()
                          .ToListAsync();
        }

        public async Task RecalculateTotalsAsync(Guid invoiceId)
        {
            var header = await _invoiceRepo.GetById(invoiceId, ignoreQueryFilter: true)
                         ?? throw new KeyNotFoundException("Invoice bulunamadı.");

            var linesQ = await _lineRepo.GetBy(x => x.InvoiceId == invoiceId && x.Status != Status.Deleted);
            var lines = await linesQ.AsNoTracking().ToListAsync();

            decimal subtotal = lines.Sum(l => l.Amount);
            decimal tax = header.Tax;   // istersen burada KDV oranı uygula
            decimal total = subtotal + tax;

            header.Subtotal = subtotal;
            header.Total = total;
            header.ModifiedDate = DateTime.UtcNow;

            await _invoiceRepo.Update(header);
            await _uow.SaveChangesAsync();
        }

        private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        #endregion

        #region Lines

        public async Task<List<InvoiceLineDTO>> GetLinesAsync(Guid invoiceId)
        {
            var q = await _lineRepo.GetBy(x => x.InvoiceId == invoiceId && x.Status != Status.Deleted);
            return await q.AsNoTracking()
                          .ProjectToType<InvoiceLineDTO>()
                          .ToListAsync();
        }

        public async Task<InvoiceLineDTO> AddLineAsync(InvoiceLineAddDTO dto)
        {
            if (dto.InvoiceId == Guid.Empty) throw new ArgumentException("InvoiceId zorunlu.");
            ValidateLineMoney(dto.Quantity, dto.UnitPrice);

            // Header çek, var mı yok mu
            var inv = await _invoiceRepo.GetById(dto.InvoiceId)
                      ?? throw new KeyNotFoundException("Invoice bulunamadı.");

            // Amount’ı server hesaplasın (net ve tutarlı)
            var amount = Decimal.Round(dto.Quantity * dto.UnitPrice, 4, MidpointRounding.AwayFromZero);

            var now = DateTime.UtcNow;
            var entity = dto.Adapt<InvoiceLine>();
            entity.Id = Guid.NewGuid();
            entity.Status = Status.Active;
            entity.CreatedDate = now;
            entity.ModifiedDate = now;
            entity.Amount = amount;

            await _lineRepo.AddAsync(entity);
            await _uow.SaveChangesAsync();

            // Satır eklendi; totals yeniden hesap
            await RecalculateTotalsAsync(dto.InvoiceId);

            return entity.Adapt<InvoiceLineDTO>();
        }

        public async Task<List<InvoiceLineDTO>> AddLinesAsync(IEnumerable<InvoiceLineAddDTO> lines)
        {
            var list = lines?.ToList() ?? new List<InvoiceLineAddDTO>();
            if (!list.Any()) return new List<InvoiceLineDTO>();

            var invoiceId = list.First().InvoiceId;
            if (invoiceId == Guid.Empty || list.Any(x => x.InvoiceId != invoiceId))
                throw new InvalidOperationException("Toplu eklemede tüm satırların InvoiceId’si aynı olmalı.");

            var inv = await _invoiceRepo.GetById(invoiceId)
                      ?? throw new KeyNotFoundException("Invoice bulunamadı.");

            var now = DateTime.UtcNow;
            var entities = new List<InvoiceLine>();

            foreach (var dto in list)
            {
                ValidateLineMoney(dto.Quantity, dto.UnitPrice);
                var amount = Decimal.Round(dto.Quantity * dto.UnitPrice, 4, MidpointRounding.AwayFromZero);

                var entity = dto.Adapt<InvoiceLine>();
                entity.Id = Guid.NewGuid();
                entity.Status = Status.Active;
                entity.CreatedDate = now;
                entity.ModifiedDate = now;
                entity.Amount = amount;

                entities.Add(entity);
            }

            await _lineRepo.AddRangeAsync(entities);
            await _uow.SaveChangesAsync();

            await RecalculateTotalsAsync(invoiceId);

            return entities.Adapt<List<InvoiceLineDTO>>();
        }

        public async Task UpdateLineAsync(InvoiceLineUpdateDTO dto)
        {
            if (dto.Id == Guid.Empty) throw new ArgumentException("Id zorunlu.");
            ValidateLineMoney(dto.Quantity, dto.UnitPrice);

            var line = await _lineRepo.GetById(dto.Id, include: null, predicate: null, ignoreQueryFilter: true)
                       ?? throw new KeyNotFoundException("InvoiceLine bulunamadı.");

            // Amount’ı her zaman server hesaplasın
            var amount = Decimal.Round(dto.Quantity * dto.UnitPrice, 4, MidpointRounding.AwayFromZero);

            line = dto.Adapt(line);
            line.Amount = amount;
            line.ModifiedDate = DateTime.UtcNow;

            await _lineRepo.Update(line);
            await _uow.SaveChangesAsync();

            await RecalculateTotalsAsync(line.InvoiceId);
        }

        public async Task DeleteLineAsync(Guid lineId)
        {
            var line = await _lineRepo.GetById(lineId, ignoreQueryFilter: true)
                       ?? throw new KeyNotFoundException("InvoiceLine bulunamadı.");

            var invoiceId = line.InvoiceId;

            await _lineRepo.Delete(line); // soft delete
            await _uow.SaveChangesAsync();

            await RecalculateTotalsAsync(invoiceId);
        }

        #endregion

        #region IBaseService glue

        // IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO> gereği:
        Task<List<InvoiceDTO>> IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>.GetAll()
            => GetAll();

        Task<InvoiceDTO> IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>.GetById(Guid id)
            => GetById(id);

        Task IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>.Add(InvoiceAddDTO dto)
            => Add(dto);

        Task IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>.Update(InvoiceUpdateDTO dto)
            => Update(dto);

        Task IBaseService<InvoiceDTO, InvoiceAddDTO, InvoiceUpdateDTO>.Delete(Guid id)
            => Delete(id);

        #endregion

        #region Guards

        private static void ValidateHeader(DateTime start, DateTime end)
        {
            if (start == default || end == default) throw new ArgumentException("PeriodStart/End zorunlu.");
            if (end < start) throw new ArgumentException("PeriodEnd, PeriodStart’tan küçük olamaz.");
        }

        private static void ValidateMoney(decimal subtotal, decimal tax, decimal total)
        {
            if (subtotal < 0 || tax < 0 || total < 0)
                throw new ArgumentException("Tutarlar negatif olamaz.");
            // İstersen: if (subtotal + tax != total) -> toleransla kontrol
        }

        private static void ValidateLineMoney(decimal qty, decimal unitPrice)
        {
            if (qty < 0) throw new ArgumentException("Quantity negatif olamaz.");
            if (unitPrice < 0) throw new ArgumentException("UnitPrice negatif olamaz.");
        }

        #endregion
    }
}
