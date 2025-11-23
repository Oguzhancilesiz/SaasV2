namespace SaasV2.DTOs.InvoiceDTOs
{
    public class InvoicePaymentRetryRequestDTO
    {
        /// <summary>
        /// İşlem durumuna bakılmaksızın yeniden deneme zorlaması (default: false)
        /// </summary>
        public bool Force { get; set; } = false;
    }

    public class InvoicePaymentCancelRequestDTO
    {
        /// <summary>
        /// İptal gerekçesi (opsiyonel)
        /// </summary>
        public string? Reason { get; set; }
    }
}

