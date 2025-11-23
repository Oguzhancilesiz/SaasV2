import { getAllFeatures } from "@/lib/featuresService";
import { getAllApps } from "@/lib/appsService";
import type { FeatureDto } from "@/types/feature";
import { Status } from "@/types/app";
import FilterToolbar from "@/components/filters/FilterToolbar";
import FeaturesListClient from "./FeaturesListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";
import AppFilterClient from "./AppFilterClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function FeaturesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const [features, apps] = await Promise.all([
    getAllFeatures(),
    getAllApps(),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<FeatureDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((feature) => feature.appId === appId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<FeatureDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    name_asc: (a: FeatureDto, b: FeatureDto) => (a.name || "").localeCompare(b.name || ""),
    name_desc: (a: FeatureDto, b: FeatureDto) => (b.name || "").localeCompare(a.name || ""),
    key_asc: (a: FeatureDto, b: FeatureDto) => (a.key || "").localeCompare(b.key || ""),
    key_desc: (a: FeatureDto, b: FeatureDto) => (b.key || "").localeCompare(a.key || ""),
    created_desc: (a: FeatureDto, b: FeatureDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: FeatureDto, b: FeatureDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredFeatures, pagination } = processItems({
    items: features,
    searchQuery,
    searchFields: ["name", "key", "description"],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const selectedApp = appId ? apps.find(a => a.id === appId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Özellikler</h1>
          <p className={text.muted + " text-sm"}>
            {selectedApp ? `${selectedApp.name} - ` : ""}
            {pagination.totalItems} {pagination.totalItems === 1 ? "özellik" : "özellik"} bulundu
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedApp && (
            <a
              href="/features"
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl",
                "bg-neutral-800/50 hover:bg-neutral-800 text-sm",
                "text-neutral-300 hover:text-white transition-all border border-neutral-800/50"
              )}
            >
              Tüm Özellikler
            </a>
          )}
          <a
            href={appId ? `/features/yeni?appId=${appId}` : "/features/yeni"}
            className={components.buttonPrimary}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Yeni Özellik</span>
            <span className="sm:hidden">Yeni</span>
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className={cn(components.card, "p-4")}>
        <FilterToolbar
          config={{
            searchPlaceholder: "Ara: ad, anahtar veya açıklama",
            searchFields: ["name", "key", "description"],
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
              { value: "key_asc", label: "Anahtar A→Z" },
              { value: "key_desc", label: "Anahtar Z→A" },
            ],
          }}
        />
      </div>

      {/* App Filter */}
      <Suspense fallback={<div className={cn(components.card, "p-4")}>Yükleniyor...</div>}>
        <AppFilterClient apps={apps} currentAppId={appId} />
      </Suspense>

      {/* Features List */}
      <FeaturesListClient 
        features={filteredFeatures} 
        apps={apps} 
        searchQuery={searchQuery} 
        appId={appId}
        pagination={pagination}
      />
    </div>
  );
}

