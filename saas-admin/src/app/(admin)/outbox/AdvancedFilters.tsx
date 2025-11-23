"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Status } from "@/types/app";
import SearchableSelect from "../subscriptions/SearchableSelect";
import type { AppDto } from "@/types/app";

export default function AdvancedFilters({ apps }: { apps: AppDto[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Sayfa numarasını sıfırla
    params.delete("page");
    const newUrl = `${pathname}?${params.toString()}`;
    router.push(newUrl);
  };

  const statusFilter = searchParams.get("status") || "all";
  const appIdFilter = searchParams.get("appId") || "";
  const typeFilter = searchParams.get("type") || "";
  const pendingFilter = searchParams.get("pending") || "all";

  // Unique types
  const types = Array.from(new Set(apps.flatMap(() => []))); // Bu kısım dinamik olarak type'ları çekebilir

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
      {/* Uygulama Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 3 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Uygulama</label>
        <SearchableSelect
          options={apps}
          value={appIdFilter}
          onChange={(value) => updateFilter("appId", value)}
          getLabel={(app) => `${app.name} (${app.code})`}
          getValue={(app) => app.id}
          placeholder="Tüm Uygulamalar"
          searchPlaceholder="Uygulama ara..."
          emptyText="Uygulama bulunamadı"
        />
      </div>

      {/* Type Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 2 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Type</label>
        <input
          type="text"
          value={typeFilter}
          onChange={(e) => updateFilter("type", e.target.value)}
          placeholder="Mesaj tipi..."
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        />
      </div>

      {/* Pending Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 1 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Durum</label>
        <select
          value={pendingFilter}
          onChange={(e) => updateFilter("pending", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        >
          <option value="all">Tümü</option>
          <option value="true">Bekleyen</option>
          <option value="false">İşlenmiş</option>
        </select>
      </div>

      {/* Status Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
        <label className="block text-sm font-medium text-neutral-200 mb-2">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        >
          <option value="all">Tümü</option>
          <option value="active">Aktif</option>
          <option value="passive">Pasif</option>
        </select>
      </div>
    </div>
  );
}

