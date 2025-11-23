"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { Search, X } from "lucide-react";
import { components, text, transition } from "@/lib/theme";
import { cn } from "@/lib/utils";

export type FilterOption = {
  value: string;
  label: string;
};

export type SortOption = {
  value: string;
  label: string;
};

export type FilterConfig = {
  searchPlaceholder?: string;
  searchFields?: string[];
  statusOptions?: FilterOption[];
  sortOptions?: SortOption[];
  showStatusFilter?: boolean;
  showSortFilter?: boolean;
  showSearch?: boolean;
  debounceMs?: number;
};

type FilterToolbarProps = {
  config: FilterConfig;
  onFilterChange?: (filters: FilterState) => void;
};

export type FilterState = {
  search: string;
  status: string;
  sort: string;
  page: number;
};

const defaultConfig: FilterConfig = {
  searchPlaceholder: "Ara...",
  searchFields: [],
  statusOptions: [
    { value: "all", label: "Tümü" },
    { value: "active", label: "Aktif" },
    { value: "passive", label: "Pasif" },
  ],
  sortOptions: [
    { value: "created_desc", label: "Yeni eklenen" },
    { value: "created_asc", label: "Eskiden yeniye" },
    { value: "name_asc", label: "Ad A→Z" },
    { value: "name_desc", label: "Ad Z→A" },
  ],
  showStatusFilter: true,
  showSortFilter: true,
  showSearch: true,
  debounceMs: 300,
};

export default function FilterToolbar({ config, onFilterChange }: FilterToolbarProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const finalConfig = { ...defaultConfig, ...config };

  const [search, setSearch] = useState(sp.get("q") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "all");
  const [sort, setSort] = useState(sp.get("sort") ?? finalConfig.sortOptions?.[0]?.value ?? "created_desc");
  const [page, setPage] = useState(Number(sp.get("page") ?? "1"));

  useEffect(() => {
    setSearch(sp.get("q") ?? "");
    setStatus(sp.get("status") ?? "all");
    setSort(sp.get("sort") ?? finalConfig.sortOptions?.[0]?.value ?? "created_desc");
    setPage(Number(sp.get("page") ?? "1"));
  }, [sp, finalConfig.sortOptions]);

  const updateURL = useCallback(
    (updates: Partial<FilterState>) => {
      const params = new URLSearchParams(sp.toString());
      
      if (updates.search !== undefined) {
        updates.search ? params.set("q", updates.search) : params.delete("q");
      }
      if (updates.status !== undefined) {
        params.set("status", updates.status);
      }
      if (updates.sort !== undefined) {
        params.set("sort", updates.sort);
      }
      if (updates.page !== undefined) {
        updates.page > 1 ? params.set("page", String(updates.page)) : params.delete("page");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
      
      if (onFilterChange) {
        const newState: FilterState = {
          search: updates.search ?? search,
          status: updates.status ?? status,
          sort: updates.sort ?? sort,
          page: updates.page ?? page,
        };
        onFilterChange(newState);
      }
    },
    [sp, router, pathname, search, status, sort, page, onFilterChange]
  );

  // Debounced search - URL'deki değerle karşılaştır
  useEffect(() => {
    const currentSearch = sp.get("q") ?? "";
    if (search === currentSearch) return; // Zaten senkronize
    
    const timer = setTimeout(() => {
      updateURL({ search, page: 1 });
    }, finalConfig.debounceMs ?? 300);

    return () => clearTimeout(timer);
  }, [search, finalConfig.debounceMs]); // sp ve updateURL dependency'den çıkarıldı

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    updateURL({ status: newStatus, page: 1 });
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    updateURL({ sort: newSort, page: 1 });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      updateURL({ search, page: 1 });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
      {finalConfig.showSearch && (
        <div className="relative flex-[2] min-w-0">
          <input
            type="text"
            placeholder={finalConfig.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className={components.input + " pl-10 pr-10 w-full"}
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                updateURL({ search: "", page: 1 });
              }}
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg",
                "hover:bg-neutral-800/50",
                transition.default,
                text.muted
              )}
              title="Aramayı temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
        {finalConfig.showStatusFilter && finalConfig.statusOptions && (
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={components.input + " cursor-pointer w-full sm:w-auto"}
          >
            {finalConfig.statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-neutral-900">
                {option.label}
              </option>
            ))}
          </select>
        )}

        {finalConfig.showSortFilter && finalConfig.sortOptions && (
          <select
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
            className={components.input + " cursor-pointer w-full sm:w-auto"}
          >
            {finalConfig.sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-neutral-900">
                {option.label}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
