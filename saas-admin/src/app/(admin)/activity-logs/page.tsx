import { getAllActivityLogs } from "@/lib/activityLogsService";
import { getAllApps } from "@/lib/appsService";
import { getAllUsers } from "@/lib/usersService";
import type { ActivityLogDto } from "@/types/activityLog";
import FilterToolbar from "@/components/filters/FilterToolbar";
import ActivityLogsListClient from "./ActivityLogsListClient";
import { processItems, type FilterFunction } from "@/lib/filterUtils";
import Pagination from "@/components/filters/Pagination";
import AdvancedFilters from "./AdvancedFilters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 20;

export default async function ActivityLogsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const appId = params.appId;
  const userId = params.userId;
  const searchQuery = params.q ?? "";
  const actionFilter = params.action ?? "all";
  const entityTypeFilter = params.entityType ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const [logs, apps, users] = await Promise.all([
    getAllActivityLogs().catch(() => []),
    getAllApps().catch(() => []),
    getAllUsers().catch(() => []),
  ]);

  // Custom filter fonksiyonları
  const customFilters: FilterFunction<ActivityLogDto>[] = [];

  // App filtresi
  if (appId) {
    customFilters.push((log) => log.appId === appId);
  }

  // User filtresi
  if (userId) {
    customFilters.push((log) => log.userId === userId);
  }

  // Action filtresi
  if (actionFilter !== "all") {
    customFilters.push((log) => log.action === actionFilter);
  }

  // Entity Type filtresi
  if (entityTypeFilter !== "all") {
    customFilters.push((log) => log.entityType === entityTypeFilter);
  }

  // Search query filtresi
  const searchFilter: FilterFunction<ActivityLogDto> = (log) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.description?.toLowerCase().includes(query) ||
      log.entityType?.toLowerCase().includes(query) ||
      log.action?.toLowerCase().includes(query) ||
      log.userName?.toLowerCase().includes(query) ||
      log.userEmail?.toLowerCase().includes(query) ||
      log.appName?.toLowerCase().includes(query) ||
      log.appCode?.toLowerCase().includes(query) ||
      false
    );
  };

  // Sıralama konfigürasyonu
  const sortConfig = {
    created_desc: (a: ActivityLogDto, b: ActivityLogDto) => 
      new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    created_asc: (a: ActivityLogDto, b: ActivityLogDto) => 
      new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
    action_asc: (a: ActivityLogDto, b: ActivityLogDto) => 
      a.action.localeCompare(b.action),
    action_desc: (a: ActivityLogDto, b: ActivityLogDto) => 
      b.action.localeCompare(a.action),
    entity_asc: (a: ActivityLogDto, b: ActivityLogDto) => 
      a.entityType.localeCompare(b.entityType),
    entity_desc: (a: ActivityLogDto, b: ActivityLogDto) => 
      b.entityType.localeCompare(a.entityType),
  };

  // Tüm filtreleri birleştir
  const allFilters = [...customFilters, searchFilter];

  // Filtreleme, sıralama ve sayfalama
  const { items: paginatedLogs, pagination } = processItems({
    items: logs,
    searchQuery: "", // Arama zaten custom filter'da yapılıyor
    searchFields: [],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: allFilters,
  });

  // Unique actions ve entity types for filters
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).sort();
  const uniqueEntityTypes = Array.from(new Set(logs.map(l => l.entityType))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Aktivite Logları</h1>
          <p className="text-neutral-400 text-sm">
            Sistemde yapılan tüm işlemlerin kayıtları
          </p>
        </div>
      </div>

      <FilterToolbar
        searchQuery={searchQuery}
        searchPlaceholder="Açıklama, kullanıcı, uygulama ara..."
      />

      <AdvancedFilters
        apps={apps}
        users={users}
        selectedAppId={appId}
        selectedUserId={userId}
        selectedAction={actionFilter}
        selectedEntityType={entityTypeFilter}
        actions={uniqueActions}
        entityTypes={uniqueEntityTypes}
        sortKey={sortKey}
      />

      <ActivityLogsListClient
        logs={paginatedLogs}
        apps={apps}
        users={users}
      />

      {pagination.totalPages > 1 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          basePath="/activity-logs"
          searchParams={params}
        />
      )}
    </div>
  );
}

