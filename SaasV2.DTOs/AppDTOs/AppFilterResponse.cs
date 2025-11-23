using System;
using System.Collections.Generic;

namespace SaasV2.DTOs.AppDTOs
{
    public class AppFilterResponse
    {
        public List<AppDTO> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
    }
}

