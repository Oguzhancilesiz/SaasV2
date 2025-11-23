import { getAllUsageRecords } from "@/lib/usageRecordsService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import { getAllFeatures } from "@/lib/featuresService";
import type { UsageRecordDto } from "@/lib/usageRecordsService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import UsageRecordsListClient from "./UsageRecordsListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function UsageRecordsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const userId = params.userId;
  const featureId = params.featureId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "occurred_desc";
  const page = Number(params.page ?? "1");
  
  const [usageRecords, apps, users, features] = await Promise.all([
    getAllUsageRecords(appId, userId, featureId).catch(() => []),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
    getAllFeatures().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<UsageRecordDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((record) => record.appId === appId);
  }

  // User filtresi
  if (userId) {
    customFilters.push((record) => record.userId === userId);
  }

  // Feature filtresi
  if (featureId) {
    customFilters.push((record) => record.featureId === featureId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<UsageRecordDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    occurred_desc: (a: UsageRecordDto, b: UsageRecordDto) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    occurred_asc: (a: UsageRecordDto, b: UsageRecordDto) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime(),
    quantity_desc: (a: UsageRecordDto, b: UsageRecordDto) => b.quantity - a.quantity,
    quantity_asc: (a: UsageRecordDto, b: UsageRecordDto) => a.quantity - b.quantity,
    created_desc: (a: UsageRecordDto, b: UsageRecordDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: UsageRecordDto, b: UsageRecordDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredRecords, pagination } = processItems({
    items: usageRecords,
    searchQuery,
    searchFields: ["correlationId", "metadataJson"],
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Kullanım Kayıtları</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "kayıt" : "kayıt"} bulundu
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: correlation ID veya metadata",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
              sortOptions: [
                { value: "occurred_desc", label: "En yeni kullanım" },
                { value: "occurred_asc", label: "En eski kullanım" },
                { value: "quantity_desc", label: "Miktar (Yüksek→Düşük)" },
                { value: "quantity_asc", label: "Miktar (Düşük→Yüksek)" },
                { value: "created_desc", label: "Yeni eklenen" },
                { value: "created_asc", label: "Eskiden yeniye" },
              ],
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters apps={apps} users={users} features={features} />
      </Suspense>

      {/* Usage Records List */}
      <UsageRecordsListClient 
        usageRecords={filteredRecords} 
        apps={apps} 
        users={users}
        features={features}
        searchQuery={searchQuery}
        appId={appId}
        userId={userId}
        featureId={featureId}
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

