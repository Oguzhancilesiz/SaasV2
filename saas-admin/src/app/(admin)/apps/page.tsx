import { getFilteredApps } from "@/lib/appsService";
import type { AppDto, AppFilterResponse } from "@/types/app";
import { Status } from "@/types/app";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import NotificationHandler from "./NotificationHandler";
import AppsListClient from "./AppsListClient";
import { processItems, type FilterFunction } from "@/lib/filterUtils";
import { Plus } from "lucide-react";
import { components, text } from "@/lib/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

/* ---------- PAGE (SSR) ---------- */
export default async function AppsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");

  const allApps = await getFilteredApps({
    searchQuery: undefined,
    status: undefined,
    sort: "created_desc",
    page: 1,
    pageSize: 1000, // Get all for client-side filtering
  });

  // Status filtresi fonksiyonu
  const statusFilterFn: FilterFunction<AppDto> | null = (() => {
    if (statusFilter === "all") return null;
    
    const statusNum = (() => {
      switch (statusFilter) {
        case "active": return Status.Active;
        case "passive": return Status.DeActive;
        default: return null;
      }
    })();
    
    if (statusNum === null) return null;
    
    return (app) => Number(app.status) === statusNum;
  })();

  // Sıralama konfigürasyonu
  const sortConfig = {
    name_asc: (a: AppDto, b: AppDto) => (a.name || "").localeCompare(b.name || ""),
    name_desc: (a: AppDto, b: AppDto) => (b.name || "").localeCompare(a.name || ""),
    code_asc: (a: AppDto, b: AppDto) => (a.code || "").localeCompare(b.code || ""),
    code_desc: (a: AppDto, b: AppDto) => (b.code || "").localeCompare(a.code || ""),
    created_desc: (a: AppDto, b: AppDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: AppDto, b: AppDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredApps, pagination } = processItems({
    items: allApps.items,
    searchQuery,
    searchFields: ["name", "code", "description"],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: statusFilterFn ? [statusFilterFn] : undefined,
  });

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <NotificationHandler />
      </Suspense>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Uygulamalar</h1>
          <p className={text.muted + " text-sm"}>
            {pagination.totalItems} {pagination.totalItems === 1 ? "uygulama" : "uygulama"} bulundu
          </p>
        </div>
        <a
          href="/apps/yeni"
          className={components.buttonPrimary}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Uygulama</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <div className={cn(
        components.card,
        "p-4"
      )}>
        <FilterToolbar
          config={{
            searchPlaceholder: "Ara: ad, kod veya açıklama",
            searchFields: ["name", "code", "description"],
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
              { value: "code_asc", label: "Kod A→Z" },
              { value: "code_desc", label: "Kod Z→A" },
            ],
          }}
        />
      </div>

      {/* Apps List */}
      <AppsListClient 
        apps={filteredApps} 
        searchQuery={searchQuery}
        pagination={pagination}
      />
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
