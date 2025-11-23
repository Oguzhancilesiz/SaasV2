import { getAllOutboxMessages } from "@/lib/outboxService";
import { getAllApps } from "@/lib/appsService";
import type { OutboxMessageDto } from "@/lib/outboxService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import OutboxListClient from "./OutboxListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function OutboxPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const type = params.type;
  const pending = params.pending === "true" ? true : params.pending === "false" ? false : undefined;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "occurred_desc";
  const page = Number(params.page ?? "1");
  
  const [messages, apps] = await Promise.all([
    getAllOutboxMessages(appId, type, pending).catch(() => []),
    getAllApps().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<OutboxMessageDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((msg) => msg.appId === appId);
  }

  // Type filtresi
  if (type) {
    customFilters.push((msg) => msg.type === type);
  }

  // Pending filtresi
  if (pending !== undefined) {
    if (pending) {
      customFilters.push((msg) => msg.processedAt == null);
    } else {
      customFilters.push((msg) => msg.processedAt != null);
    }
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<OutboxMessageDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    occurred_desc: (a: OutboxMessageDto, b: OutboxMessageDto) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    occurred_asc: (a: OutboxMessageDto, b: OutboxMessageDto) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    processed_desc: (a: OutboxMessageDto, b: OutboxMessageDto) => {
      if (!a.processedAt && !b.processedAt) return 0;
      if (!a.processedAt) return 1;
      if (!b.processedAt) return -1;
      return new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime();
    },
    processed_asc: (a: OutboxMessageDto, b: OutboxMessageDto) => {
      if (!a.processedAt && !b.processedAt) return 0;
      if (!a.processedAt) return -1;
      if (!b.processedAt) return 1;
      return new Date(a.processedAt).getTime() - new Date(b.processedAt).getTime();
    },
    retries_desc: (a: OutboxMessageDto, b: OutboxMessageDto) => b.retries - a.retries,
    retries_asc: (a: OutboxMessageDto, b: OutboxMessageDto) => a.retries - b.retries,
    created_desc: (a: OutboxMessageDto, b: OutboxMessageDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: OutboxMessageDto, b: OutboxMessageDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredMessages, pagination } = processItems({
    items: messages,
    searchQuery,
    searchFields: ["type", "payload"],
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Outbox Mesajları</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "mesaj" : "mesaj"} bulundu
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: type veya payload",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
              sortOptions: [
                { value: "occurred_desc", label: "En yeni olay" },
                { value: "occurred_asc", label: "En eski olay" },
                { value: "processed_desc", label: "En yeni işlenen" },
                { value: "processed_asc", label: "En eski işlenen" },
                { value: "retries_desc", label: "Yeniden deneme (Yüksek→Düşük)" },
                { value: "retries_asc", label: "Yeniden deneme (Düşük→Yüksek)" },
                { value: "created_desc", label: "Yeni eklenen" },
                { value: "created_asc", label: "Eskiden yeniye" },
              ],
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters apps={apps} />
      </Suspense>

      {/* Messages List */}
      <OutboxListClient 
        messages={filteredMessages} 
        apps={apps}
        searchQuery={searchQuery}
        appId={appId}
        type={type}
        pending={pending}
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

