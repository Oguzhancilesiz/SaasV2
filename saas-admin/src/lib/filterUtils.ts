// Generic filtreleme ve sıralama utility fonksiyonları

export type SortFunction<T> = (a: T, b: T) => number;

export type FilterFunction<T> = (item: T) => boolean;

export type SortConfig<T> = {
  [key: string]: SortFunction<T>;
};

/**
 * Generic filtreleme fonksiyonu
 */
export function filterItems<T>(
  items: T[],
  searchQuery: string,
  searchFields: (keyof T)[],
  customFilters?: FilterFunction<T>[]
): T[] {
  let filtered = items;

  // Arama filtresi
  if (searchQuery && searchFields.length > 0) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }

  // Özel filtreler
  if (customFilters) {
    customFilters.forEach((filterFn) => {
      filtered = filtered.filter(filterFn);
    });
  }

  return filtered;
}

/**
 * Generic sıralama fonksiyonu
 */
export function sortItems<T>(
  items: T[],
  sortKey: string,
  sortConfig: SortConfig<T>
): T[] {
  const sortFn = sortConfig[sortKey];
  if (!sortFn) {
    // Varsayılan sıralama
    return items;
  }

  return [...items].sort(sortFn);
}

/**
 * Generic sayfalama fonksiyonu
 */
export function paginateItems<T>(
  items: T[],
  page: number,
  itemsPerPage: number
): { items: T[]; pagination: PaginationInfo } {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const paginatedItems = items.slice(startIndex, endIndex);

  return {
    items: paginatedItems,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    },
  };
}

export type PaginationInfo = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/**
 * Tüm filtreleme, sıralama ve sayfalama işlemlerini birleştiren fonksiyon
 */
export function processItems<T>(config: {
  items: T[];
  searchQuery?: string;
  searchFields?: (keyof T)[];
  sortKey?: string;
  sortConfig?: SortConfig<T>;
  page?: number;
  itemsPerPage?: number;
  customFilters?: FilterFunction<T>[];
}): {
  items: T[];
  pagination: PaginationInfo;
} {
  const {
    items,
    searchQuery = "",
    searchFields = [],
    sortKey = "",
    sortConfig = {},
    page = 1,
    itemsPerPage = 10,
    customFilters,
  } = config;

  // 1. Filtreleme
  let processed = filterItems(items, searchQuery, searchFields, customFilters);

  // 2. Sıralama
  if (sortKey && sortConfig[sortKey]) {
    processed = sortItems(processed, sortKey, sortConfig);
  }

  // 3. Sayfalama
  const result = paginateItems(processed, page, itemsPerPage);

  return result;
}

/**
 * Status filtresi için yardımcı fonksiyon
 */
export function createStatusFilter<T>(
  statusValue: string,
  statusField: keyof T,
  activeValue: number | string = 1
): FilterFunction<T> | null {
  if (statusValue === "all") return null;

  if (statusValue === "active") {
    return (item) => item[statusField] === activeValue;
  }

  if (statusValue === "passive") {
    return (item) => item[statusField] !== activeValue;
  }

  return null;
}

/**
 * Yaygın sıralama konfigürasyonları
 */
export function createCommonSortConfig<T extends { name?: string; code?: string; createdDate?: string }>(): SortConfig<T> {
  return {
    name_asc: (a, b) => (a.name || "").localeCompare(b.name || ""),
    name_desc: (a, b) => (b.name || "").localeCompare(a.name || ""),
    code_asc: (a, b) => (a.code || "").localeCompare(b.code || ""),
    code_desc: (a, b) => (b.code || "").localeCompare(a.code || ""),
    created_asc: (a, b) => {
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateA - dateB;
    },
    created_desc: (a, b) => {
      const dateA = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const dateB = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return dateB - dateA;
    },
  };
}

