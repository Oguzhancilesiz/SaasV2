import { getAllAppUserRegistrations } from "@/lib/appUserRegistrationsService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import type { AppUserRegistrationDto } from "@/lib/appUserRegistrationsService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import AppUserRegistrationsListClient from "./AppUserRegistrationsListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function AppUserRegistrationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const userId = params.userId;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "registered_desc";
  const page = Number(params.page ?? "1");
  
  const [registrations, apps, users] = await Promise.all([
    getAllAppUserRegistrations(appId, userId).catch(() => []),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<AppUserRegistrationDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((reg) => reg.appId === appId);
  }

  // User filtresi
  if (userId) {
    customFilters.push((reg) => reg.userId === userId);
  }

  // Status filtresi
  const statusFilterFn = createStatusFilter<AppUserRegistrationDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    registered_desc: (a: AppUserRegistrationDto, b: AppUserRegistrationDto) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
    registered_asc: (a: AppUserRegistrationDto, b: AppUserRegistrationDto) => new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime(),
    created_desc: (a: AppUserRegistrationDto, b: AppUserRegistrationDto) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: AppUserRegistrationDto, b: AppUserRegistrationDto) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredRegistrations, pagination } = processItems({
    items: registrations,
    searchQuery,
    searchFields: ["provider", "externalId"],
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Kullanıcı Kayıtları</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "kayıt" : "kayıt"} bulundu
          </p>
        </div>
        <a
          href="/app-user-registrations/yeni"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Kayıt</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: provider veya external ID",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
              sortOptions: [
                { value: "registered_desc", label: "En yeni kayıt" },
                { value: "registered_asc", label: "En eski kayıt" },
                { value: "created_desc", label: "Yeni eklenen" },
                { value: "created_asc", label: "Eskiden yeniye" },
              ],
            }}
          />
        </div>
      </Suspense>

      {/* Advanced Filters */}
      <Suspense fallback={<div className="h-32" />}>
        <AdvancedFilters apps={apps} users={users} />
      </Suspense>

      {/* Registrations List */}
      <AppUserRegistrationsListClient 
        registrations={filteredRegistrations} 
        apps={apps} 
        users={users}
        searchQuery={searchQuery}
        appId={appId}
        userId={userId}
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

