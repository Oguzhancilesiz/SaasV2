import { getAllWebhookDeliveries } from "@/lib/webhookDeliveriesService";
import { getAllWebhookEndpoints } from "@/lib/webhooksService";
import type { WebhookDeliveryDto } from "@/lib/webhookDeliveriesService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import WebhookDeliveriesListClient from "./WebhookDeliveriesListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function WebhookDeliveriesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const webhookEndpointId = params.webhookEndpointId;
  const eventType = params.eventType;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "attempted_desc";
  const page = Number(params.page ?? "1");
  
  const [deliveries, endpoints] = await Promise.all([
    getAllWebhookDeliveries(webhookEndpointId, eventType).catch(() => []),
    getAllWebhookEndpoints().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<WebhookDeliveryDto>[] = [];

  // Webhook Endpoint filtresi
  if (webhookEndpointId) {
    customFilters.push((delivery) => delivery.webhookEndpointId === webhookEndpointId);
  }

  // Event Type filtresi
  if (eventType) {
    customFilters.push((delivery) => delivery.eventType === eventType);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<WebhookDeliveryDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    attempted_desc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime(),
    attempted_asc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime(),
    status_desc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => b.responseStatus - a.responseStatus,
    status_asc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => a.responseStatus - b.responseStatus,
    created_desc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: WebhookDeliveryDto, b: WebhookDeliveryDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredDeliveries, pagination } = processItems({
    items: deliveries,
    searchQuery,
    searchFields: ["eventType", "payload"],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: customFilters.length > 0 ? customFilters : undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Webhook Teslimatları</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "teslimat" : "teslimat"} bulundu
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: event type veya payload",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
              sortOptions: [
                { value: "attempted_desc", label: "En yeni deneme" },
                { value: "attempted_asc", label: "En eski deneme" },
                { value: "status_desc", label: "Status (Yüksek→Düşük)" },
                { value: "status_asc", label: "Status (Düşük→Yüksek)" },
                { value: "created_desc", label: "Yeni eklenen" },
                { value: "created_asc", label: "Eskiden yeniye" },
              ],
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters endpoints={endpoints} />
      </Suspense>

      {/* Deliveries List */}
      <WebhookDeliveriesListClient 
        deliveries={filteredDeliveries} 
        endpoints={endpoints}
        searchQuery={searchQuery}
        webhookEndpointId={webhookEndpointId}
        eventType={eventType}
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

