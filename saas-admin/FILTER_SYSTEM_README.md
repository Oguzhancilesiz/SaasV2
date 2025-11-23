# 🔍 Generic Filtreleme, Arama ve Pagination Sistemi

Bu sistem, tüm sayfalarda kullanabileceğiniz genel bir filtreleme, arama ve pagination çözümüdür.

## 📁 Oluşturulan Dosyalar

1. **`src/components/filters/FilterToolbar.tsx`** - Filtreleme toolbar component'i
2. **`src/components/filters/Pagination.tsx`** - Pagination component'i
3. **`src/lib/filterUtils.ts`** - Filtreleme utility fonksiyonları
4. **`src/hooks/useFilter.ts`** - Filter hook'u

## 🚀 Kullanım

### 1. Temel Kullanım Örneği

```typescript
import FilterToolbar from "@/components/filters/FilterToolbar";
import Pagination from "@/components/filters/Pagination";
import { processItems, createStatusFilter, createCommonSortConfig } from "@/lib/filterUtils";

export default async function MyPage({ searchParams }) {
  const items = await fetchItems(); // Verilerinizi getirin
  
  const searchQuery = searchParams.q ?? "";
  const status = searchParams.status ?? "all";
  const sortKey = searchParams.sort ?? "created_desc";
  const page = Number(searchParams.page ?? "1");
  const itemsPerPage = 10;

  // Status filtresi
  const statusFilter = createStatusFilter<ItemType>(status, "status", 1);

  // Filtreleme, sıralama ve sayfalama
  const { items: filtered, pagination } = processItems({
    items,
    searchQuery,
    searchFields: ["name", "code", "description"], // Arama yapılacak alanlar
    sortKey,
    sortConfig: createCommonSortConfig<ItemType>(),
    page,
    itemsPerPage,
    customFilters: statusFilter ? [statusFilter] : undefined,
  });

  return (
    <div>
      <FilterToolbar
        config={{
          searchPlaceholder: "Ara...",
          searchFields: ["name", "code"],
          statusOptions: [
            { value: "all", label: "Tümü" },
            { value: "active", label: "Aktif" },
            { value: "passive", label: "Pasif" },
          ],
          sortOptions: [
            { value: "created_desc", label: "Yeni eklenen" },
            { value: "name_asc", label: "Ad A→Z" },
          ],
        }}
      />

      {/* Liste */}
      {filtered.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        totalItems={pagination.totalItems}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
}
```

### 2. FilterToolbar Konfigürasyonu

```typescript
<FilterToolbar
  config={{
    // Arama
    searchPlaceholder: "Ara: ad veya kod",
    searchFields: ["name", "code"], // Hangi alanlarda arama yapılacak
    showSearch: true, // Arama kutusunu göster/gizle
    debounceMs: 300, // Arama debounce süresi (ms)

    // Status filtresi
    showStatusFilter: true,
    statusOptions: [
      { value: "all", label: "Tümü" },
      { value: "active", label: "Aktif" },
      { value: "passive", label: "Pasif" },
    ],

    // Sıralama
    showSortFilter: true,
    sortOptions: [
      { value: "created_desc", label: "Yeni eklenen" },
      { value: "name_asc", label: "Ad A→Z" },
    ],
  }}
/>
```

### 3. Özel Sıralama Konfigürasyonu

```typescript
import { processItems, createCommonSortConfig } from "@/lib/filterUtils";

// Varsayılan sıralama (name, code, createdDate)
const sortConfig = createCommonSortConfig<ItemType>();

// Özel sıralama ekleme
const customSortConfig = {
  ...createCommonSortConfig<ItemType>(),
  price_asc: (a, b) => a.price - b.price,
  price_desc: (a, b) => b.price - a.price,
};

const { items } = processItems({
  items,
  sortKey: "price_asc",
  sortConfig: customSortConfig,
  // ...
});
```

### 4. Özel Filtreler

```typescript
import { processItems } from "@/lib/filterUtils";

const { items } = processItems({
  items,
  customFilters: [
    // Status filtresi
    (item) => item.status === 1,
    // Fiyat filtresi
    (item) => item.price > 100,
    // Tarih filtresi
    (item) => new Date(item.createdDate) > new Date("2024-01-01"),
  ],
  // ...
});
```

### 5. Filter Hook Kullanımı (Client Component)

```typescript
"use client";

import { useFilter } from "@/hooks/useFilter";

export default function MyClientComponent() {
  const { filters, itemsPerPage } = useFilter(10);

  console.log(filters.search); // Arama metni
  console.log(filters.status); // Status değeri
  console.log(filters.sort); // Sıralama değeri
  console.log(filters.page); // Sayfa numarası

  return <div>...</div>;
}
```

## 🎯 Özellikler

### FilterToolbar
- ✅ Otomatik URL senkronizasyonu
- ✅ Debounced arama (performans için)
- ✅ Enter tuşu ile anında arama
- ✅ Arama temizleme butonu
- ✅ Responsive tasarım
- ✅ Özelleştirilebilir filtreler

### Pagination
- ✅ Sayfa numaraları gösterimi
- ✅ Ellipsis (...) ile uzun listeler
- ✅ Önceki/Sonraki butonları
- ✅ Toplam kayıt sayısı gösterimi
- ✅ URL senkronizasyonu

### filterUtils
- ✅ Generic tip desteği
- ✅ Çoklu alan arama
- ✅ Özel filtreler
- ✅ Özel sıralama
- ✅ Sayfalama

## 📝 URL Parametreleri

Sistem şu URL parametrelerini kullanır:
- `?q=arama` - Arama metni
- `?status=active` - Status filtresi
- `?sort=name_asc` - Sıralama
- `?page=2` - Sayfa numarası

## 🔧 Özelleştirme

### Arama Alanlarını Değiştirme

```typescript
const { items } = processItems({
  items,
  searchFields: ["title", "description", "tags"], // Özel alanlar
  // ...
});
```

### Sayfa Başına Öğe Sayısı

```typescript
const itemsPerPage = 20; // Varsayılan 10

const { items, pagination } = processItems({
  items,
  itemsPerPage,
  // ...
});
```

### Sadece Arama (Filtre Yok)

```typescript
<FilterToolbar
  config={{
    showSearch: true,
    showStatusFilter: false,
    showSortFilter: false,
  }}
/>
```

## ✅ Apps Sayfası Örneği

`src/app/(admin)/apps/page.tsx` dosyasında tam bir örnek kullanım var. Bu dosyayı referans alarak diğer sayfalarınızı da kolayca güncelleyebilirsiniz.

## 🎨 Stil

Tüm component'ler Tailwind CSS ile stillendirilmiştir ve mevcut tasarım sisteminizle uyumludur.

## 📚 API Referansı

### `processItems<T>`
Tüm filtreleme, sıralama ve sayfalama işlemlerini yapar.

**Parametreler:**
- `items: T[]` - Filtrelenecek veri listesi
- `searchQuery?: string` - Arama metni
- `searchFields?: (keyof T)[]` - Arama yapılacak alanlar
- `sortKey?: string` - Sıralama anahtarı
- `sortConfig?: SortConfig<T>` - Sıralama konfigürasyonu
- `page?: number` - Sayfa numarası (varsayılan: 1)
- `itemsPerPage?: number` - Sayfa başına öğe (varsayılan: 10)
- `customFilters?: FilterFunction<T>[]` - Özel filtreler

**Dönen Değer:**
```typescript
{
  items: T[]; // Filtrelenmiş, sıralanmış ve sayfalanmış öğeler
  pagination: PaginationInfo;
}
```

### `createStatusFilter<T>`
Status filtresi oluşturur.

**Parametreler:**
- `statusValue: string` - "all", "active", "passive"
- `statusField: keyof T` - Status alanı
- `activeValue?: number | string` - Aktif değer (varsayılan: 1)

### `createCommonSortConfig<T>`
Yaygın sıralama konfigürasyonu oluşturur (name, code, createdDate).

## 🐛 Sorun Giderme

### Arama çalışmıyor
- `searchFields` parametresinin doğru olduğundan emin olun
- Veri tipinin string olduğundan emin olun

### Pagination çalışmıyor
- `itemsPerPage` değerinin doğru olduğundan emin olun
- Toplam sayfa sayısının 1'den büyük olduğundan emin olun

### URL parametreleri güncellenmiyor
- `FilterToolbar` ve `Pagination` component'lerinin doğru import edildiğinden emin olun
- Next.js router'ın doğru çalıştığından emin olun

