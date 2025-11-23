import { getAllWebhookEndpoints } from "@/lib/webhooksService";
import { getAllApps } from "@/lib/appsService";
import type { WebhookEndpointDto } from "@/lib/webhooksService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import WebhooksListClient from "./WebhooksListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 12;

export default async function WebhooksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const activeFilter = params.active ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const [webhooks, apps] = await Promise.all([
    getAllWebhookEndpoints().catch(() => []),
    getAllApps().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<WebhookEndpointDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((webhook) => webhook.appId === appId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<WebhookEndpointDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Active filtresi
  if (activeFilter !== "all") {
    const isActive = activeFilter === "active";
    customFilters.push((webhook) => webhook.isActive === isActive);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    created_desc: (a: WebhookEndpointDto, b: WebhookEndpointDto) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: WebhookEndpointDto, b: WebhookEndpointDto) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    url_asc: (a: WebhookEndpointDto, b: WebhookEndpointDto) => 
      a.url.localeCompare(b.url, "tr"),
    url_desc: (a: WebhookEndpointDto, b: WebhookEndpointDto) => 
      b.url.localeCompare(a.url, "tr"),
  };

  // Arama için özel filtreleme (app, url, eventTypesCsv)
  let searchFiltered = webhooks;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    searchFiltered = webhooks.filter(webhook => {
      const app = apps.find(a => a.id === webhook.appId);
      return (
        webhook.url.toLowerCase().includes(query) ||
        webhook.eventTypesCsv?.toLowerCase().includes(query) ||
        app?.name.toLowerCase().includes(query) ||
        app?.code.toLowerCase().includes(query)
      );
    });
  }

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredWebhooks, pagination } = processItems({
    items: searchFiltered,
    searchQuery: "", // Arama zaten yukarıda yapıldı
    searchFields: [],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  const finalFiltered = filteredWebhooks;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Webhook Endpoints</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "endpoint" : "endpoint"} bulundu
          </p>
        </div>
        <a
          href={appId ? `/webhooks/yeni?appId=${appId}` : "/webhooks/yeni"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Webhook Endpoint</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: URL veya event type",
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

      {/* Webhooks List */}
      <WebhooksListClient 
        webhooks={finalFiltered} 
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

