using System;

namespace SaasV2.DTOs.AppDTOs
{
    public class AppFilterRequest
    {
        public string? SearchQuery { get; set; }  // Arama metni (q)
        public string? Status { get; set; }       // "all", "active", "passive"
        public string? Sort { get; set; }         // "created_desc", "name_asc", vb.
        public int Page { get; set; } = 1;        // Sayfa numarası
        public int PageSize { get; set; } = 10;    // Sayfa başına kayıt sayısı
    }
}

