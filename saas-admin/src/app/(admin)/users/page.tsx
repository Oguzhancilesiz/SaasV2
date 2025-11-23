import { getAllUsers } from "@/lib/usersService";
import type { UserDto } from "@/types/user";
import { Status } from "@/types/app";
import FilterToolbar from "@/components/filters/FilterToolbar";
import UsersListClient from "./UsersListClient";
import { processItems, type FilterFunction } from "@/lib/filterUtils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ITEMS_PER_PAGE = 10;

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const searchQuery = params.q ?? "";
  const statusFilter = params.status ?? "all";
  const sortKey = params.sort ?? "created_desc";
  const page = Number(params.page ?? "1");
  
  const users = await getAllUsers();

  // Status filtresi fonksiyonu
  const statusFilterFn: FilterFunction<UserDto> | null = (() => {
    if (statusFilter === "all") return null;
    
    const statusNum = (() => {
      switch (statusFilter) {
        case "active": return Status.Active;
        case "deactive": return Status.DeActive;
        case "unapproved": return Status.UnApproved;
        case "approved": return Status.Approved;
        case "deleted": return Status.Deleted;
        case "cancel": return Status.Cancel;
        case "commit": return Status.Commit;
        default: return null;
      }
    })();
    
    if (statusNum === null) return null;
    
    return (user) => Number(user.status) === statusNum;
  })();

  // Sıralama konfigürasyonu
  const sortConfig = {
    userName_asc: (a: UserDto, b: UserDto) => (a.userName || "").localeCompare(b.userName || ""),
    userName_desc: (a: UserDto, b: UserDto) => (b.userName || "").localeCompare(a.userName || ""),
    email_asc: (a: UserDto, b: UserDto) => (a.email || "").localeCompare(b.email || ""),
    email_desc: (a: UserDto, b: UserDto) => (b.email || "").localeCompare(a.email || ""),
    created_desc: (a: UserDto, b: UserDto) => 0, // UserDto'da createdDate yok, varsayılan sıralama
    created_asc: (a: UserDto, b: UserDto) => 0, // UserDto'da createdDate yok, varsayılan sıralama
  };

  // Filtreleme, sıralama ve sayfalama
  const { items: filteredUsers, pagination } = processItems({
    items: users,
    searchQuery,
    searchFields: ["email", "userName", "phone"],
    sortKey,
    sortConfig,
    page,
    itemsPerPage: ITEMS_PER_PAGE,
    customFilters: statusFilterFn ? [statusFilterFn] : undefined,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Kullanıcılar</h1>
          <p className="text-neutral-400 text-sm">
            {pagination.totalItems} {pagination.totalItems === 1 ? "kullanıcı" : "kullanıcı"} bulundu
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
        <FilterToolbar
          config={{
            searchPlaceholder: "Ara: email, kullanıcı adı veya telefon",
            searchFields: ["email", "userName", "phone"],
            showStatusFilter: true,
            showSortFilter: true,
            statusOptions: [
              { value: "all", label: "Tümü" },
              { value: "active", label: "Aktif" },
              { value: "deactive", label: "Pasif" },
              { value: "unapproved", label: "Onay Bekliyor" },
              { value: "approved", label: "Onaylandı" },
              { value: "deleted", label: "Silindi" },
              { value: "cancel", label: "İptal" },
              { value: "commit", label: "Onaylandı" },
            ],
            sortOptions: [
              { value: "created_desc", label: "Yeni eklenen" },
              { value: "created_asc", label: "Eskiden yeniye" },
              { value: "userName_asc", label: "Kullanıcı Adı A→Z" },
              { value: "userName_desc", label: "Kullanıcı Adı Z→A" },
              { value: "email_asc", label: "Email A→Z" },
              { value: "email_desc", label: "Email Z→A" },
            ],
          }}
        />
      </div>

      {/* Users List */}
      <UsersListClient 
        users={filteredUsers} 
        searchQuery={searchQuery}
        pagination={pagination}
      />
    </div>
  );
}

