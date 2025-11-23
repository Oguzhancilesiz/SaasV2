import { getAllApiKeys } from "@/lib/apikeysService";
import { getAllApps } from "@/lib/appsService";
import type { ApiKeyDto } from "@/types/apikey";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import ApiKeysListClient from "./ApiKeysListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function ApiKeysPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const expiryFilter = params.expiry ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const [apiKeys, apps] = await Promise.all([
    getAllApiKeys().catch(() => []),
    getAllApps().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<ApiKeyDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((key) => key.appId === appId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<ApiKeyDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Expiry filtresi
  if (expiryFilter !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const sevenDaysLater = new Date(today);
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    switch (expiryFilter) {
      case "active":
        customFilters.push((key) => {
          if (!key.expiresAt) return true; // ExpiresAt yoksa aktif
          const expiryDate = new Date(key.expiresAt);
          return expiryDate > now;
        });
        break;
      case "expired":
        customFilters.push((key) => {
          if (!key.expiresAt) return false;
          const expiryDate = new Date(key.expiresAt);
          return expiryDate <= now;
        });
        break;
      case "expires_today":
        customFilters.push((key) => {
          if (!key.expiresAt) return false;
          const expiryDate = new Date(key.expiresAt);
          const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
          return expiryDateOnly.getTime() === today.getTime();
        });
        break;
      case "expires_7days":
        customFilters.push((key) => {
          if (!key.expiresAt) return false;
          const expiryDate = new Date(key.expiresAt);
          const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
          return expiryDateOnly > today && expiryDateOnly <= sevenDaysLater;
        });
        break;
      case "expires_30days":
        customFilters.push((key) => {
          if (!key.expiresAt) return false;
          const expiryDate = new Date(key.expiresAt);
          const expiryDateOnly = new Date(expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate());
          return expiryDateOnly > today && expiryDateOnly <= thirtyDaysLater;
        });
        break;
      case "never_expires":
        customFilters.push((key) => !key.expiresAt);
        break;
    }
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    created_desc: (a: ApiKeyDto, b: ApiKeyDto) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: ApiKeyDto, b: ApiKeyDto) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    name_asc: (a: ApiKeyDto, b: ApiKeyDto) => 
      a.name.localeCompare(b.name, "tr"),
    name_desc: (a: ApiKeyDto, b: ApiKeyDto) => 
      b.name.localeCompare(a.name, "tr"),
    expiresAt_desc: (a: ApiKeyDto, b: ApiKeyDto) => {
      const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      return bTime - aTime;
    },
    expiresAt_asc: (a: ApiKeyDto, b: ApiKeyDto) => {
      const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : 0;
      const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : 0;
      return aTime - bTime;
    },
    lastUsedAt_desc: (a: ApiKeyDto, b: ApiKeyDto) => {
      const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return bTime - aTime;
    },
    lastUsedAt_asc: (a: ApiKeyDto, b: ApiKeyDto) => {
      const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
      const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
      return aTime - bTime;
    },
  };

  // Arama için özel filtreleme (app, name, prefix, scopes)
  let searchFiltered = apiKeys;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    searchFiltered = apiKeys.filter(key => {
      const app = apps.find(a => a.id === key.appId);
      return (
        key.name.toLowerCase().includes(query) ||
        key.prefix.toLowerCase().includes(query) ||
        key.scopes?.toLowerCase().includes(query) ||
        app?.name.toLowerCase().includes(query) ||
        app?.code.toLowerCase().includes(query)
      );
    });
  }

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredApiKeys, pagination } = processItems({
    items: searchFiltered,
    searchQuery: "", // Arama zaten yukarıda yapıldı
    searchFields: [],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const finalFiltered = filteredApiKeys;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">API Anahtarları</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "anahtar" : "anahtar"} bulundu
          </p>
        </div>
        <a
          href={appId ? `/apikeys/yeni?appId=${appId}` : "/apikeys/yeni"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni API Anahtarı</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: ad, prefix veya scope",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters apps={apps} />
      </Suspense>

      {/* API Keys List */}
      <ApiKeysListClient 
        apiKeys={finalFiltered} 
        apps={apps}
        searchQuery={searchQuery}
        appId={appId}
        pagination={pagination}
      />

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            itemsPerPage={pagination.itemsPerPage}
          />
        </div>
      )}
    </div>
  );
}
