// Örnek: Generic filtreleme sistemini nasıl kullanacağınızı gösterir
// Bu dosyayı referans alarak kendi sayfalarınızı oluşturabilirsiniz

import FilterToolbar from "@/components/filters/FilterToolbar";
import Pagination from "@/components/filters/Pagination";
import { processItems, createStatusFilter, createCommonSortConfig } from "@/lib/filterUtils";

// Örnek tip tanımı
type ExampleItem = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: number;
  createdDate: string;
  price?: number;
};

// Örnek sayfa (SSR)
export default async function FilterExamplePage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  // 1. Verilerinizi getirin (API'den, DB'den vs.)
  const items: ExampleItem[] = await fetchItems();

  // 2. URL parametrelerini alın
  const searchQuery = searchParams.q ?? "";
  const status = searchParams.status ?? "all";
  const sortKey = searchParams.sort ?? "created_desc";
  const page = Number(searchParams.page ?? "1");
  const itemsPerPage = 10;

  // 3. Status filtresi oluşturun (opsiyonel)
  const statusFilter = createStatusFilter<ExampleItem>(status, "status", 1);

  // 4. Özel sıralama konfigürasyonu (opsiyonel)
  const sortConfig = {
    ...createCommonSortConfig<ExampleItem>(),
    // Özel sıralamalar ekleyebilirsiniz
    price_asc: (a: ExampleItem, b: ExampleItem) => (a.price || 0) - (b.price || 0),
    price_desc: (a: ExampleItem, b: ExampleItem) => (b.price || 0) - (a.price || 0),
  };

  // 5. Filtreleme, sıralama ve sayfalama
  const { items: filtered, pagination } = processItems({
    items,
    searchQuery,
    searchFields: ["name", "code", "description"], // Arama yapılacak alanlar
    sortKey,
    sortConfig,
    page,
    itemsPerPage,
    customFilters: statusFilter ? [statusFilter] : undefined,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Örnek Sayfa</h1>

      {/* FilterToolbar - Arama, Filtreleme, Sıralama */}
      <FilterToolbar
        config={{
          searchPlaceholder: "Ara: ad, kod veya açıklama",
          searchFields: ["name", "code", "description"],
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
            { value: "code_asc", label: "Kod A→Z" },
            { value: "code_desc", label: "Kod Z→A" },
            { value: "price_asc", label: "Fiyat Düşük→Yüksek" },
            { value: "price_desc", label: "Fiyat Yüksek→Düşük" },
          ],
        }}
      />

      {/* Sonuçlar */}
      <div className="space-y-2">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-4 rounded-xl border border-neutral-800 bg-neutral-900"
          >
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-neutral-400">{item.code}</p>
            {item.price && (
              <p className="text-sm text-neutral-300 mt-1">Fiyat: {item.price} TL</p>
            )}
          </div>
        ))}
      </div>

      {/* Boş durum */}
      {filtered.length === 0 && (
        <div className="text-center text-neutral-400 text-sm py-8">
          {searchQuery || status !== "all"
            ? "Arama kriterlerinize uygun kayıt bulunamadı."
            : "Henüz kayıt yok."}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}

// Örnek: Sadece arama (filtre yok)
export function SimpleSearchExample() {
  return (
    <FilterToolbar
      config={{
        showSearch: true,
        showStatusFilter: false,
        showSortFilter: false,
        searchPlaceholder: "Ara...",
      }}
    />
  );
}

// Örnek: Sadece sıralama (arama yok)
export function SimpleSortExample() {
  return (
    <FilterToolbar
      config={{
        showSearch: false,
        showStatusFilter: false,
        showSortFilter: true,
        sortOptions: [
          { value: "name_asc", label: "Ad A→Z" },
          { value: "name_desc", label: "Ad Z→A" },
        ],
      }}
    />
  );
}

// Mock fonksiyon
async function fetchItems(): Promise<ExampleItem[]> {
  return [];
}

