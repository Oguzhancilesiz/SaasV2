import { getAllRoles } from "@/lib/rolesService";
import type { RoleDto } from "@/lib/rolesService";
import { Suspense } from "react";
import FilterToolbar from "@/components/filters/FilterToolbar";
import RolesListClient from "./RolesListClient";
import { processItems, createStatusFilter, type FilterFunction } from "@/lib/filterUtils";
import { Status } from "@/types/app";
import { Plus } from "lucide-react";
import Pagination from "@/components/filters/Pagination";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function RolesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "name_asc";
  const page = Number(params.page ?? "1");
  
  const roles = await getAllRoles().catch(() => []);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<RoleDto>[] = [];

  // Status filtresi
  const statusFilterFn = createStatusFilter<RoleDto>(statusFilter, "status", Status.Active);
  if (statusFilterFn) {
    customFilters.push(statusFilterFn);
  }

  // Sıralama konfigürasyonu
  const sortConfig = {
    name_asc: (a: RoleDto, b: RoleDto) => (a.name || "").localeCompare(b.name || ""),
    name_desc: (a: RoleDto, b: RoleDto) => (b.name || "").localeCompare(a.name || ""),
    created_desc: (a: RoleDto, b: RoleDto) => new Date(b.cratedDate).getTime() - new Date(a.cratedDate).getTime(),
    created_asc: (a: RoleDto, b: RoleDto) => new Date(a.cratedDate).getTime() - new Date(b.cratedDate).getTime(),
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredRoles, pagination } = processItems({
    items: roles,
    searchQuery,
    searchFields: ["name"],
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Roller</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "rol" : "rol"} bulundu
          </p>
        </div>
        <a
          href="/roles/yeni"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yeni Rol</span>
          <span className="sm:hidden">Yeni</span>
        </a>
      </div>

      {/* Filter Toolbar */}
      <Suspense fallback={<div className="h-16" />}>
        <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
          <FilterToolbar
            config={{
              searchPlaceholder: "Ara: rol adı",
              searchFields: [],
              showStatusFilter: true,
              showSortFilter: true,
              showSearch: true,
              sortOptions: [
                { value: "name_asc", label: "Rol Adı A→Z" },
                { value: "name_desc", label: "Rol Adı Z→A" },
                { value: "created_desc", label: "Yeni eklenen" },
                { value: "created_asc", label: "Eskiden yeniye" },
              ],
            }}
          />
        </div>
      </Suspense>

      {/* Roles List */}
      <RolesListClient 
        roles={filteredRoles} 
        searchQuery={searchQuery}
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

