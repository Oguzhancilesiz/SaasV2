"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Status } from "@/types/app";
import SearchableSelect from "../subscriptions/SearchableSelect";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";

export default function AdvancedFilters({ apps, users }: { apps: AppDto[]; users: UserDto[] }) {
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
  const periodFilter = searchParams.get("period") || "all";
  const appIdFilter = searchParams.get("appId") || "";
  const userIdFilter = searchParams.get("userId") || "";
  const attentionFilter = searchParams.get("attention") || "all";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative">
      {/* Uygulama Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 1 }}>
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

      {/* Kullanıcı Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 1 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Kullanıcı</label>
        <SearchableSelect
          options={users}
          value={userIdFilter}
          onChange={(value) => updateFilter("userId", value)}
          getLabel={(user) => `${user.email}${user.userName ? ` (${user.userName})` : ""}`}
          getValue={(user) => user.userId}
          placeholder="Tüm Kullanıcılar"
          searchPlaceholder="Kullanıcı ara..."
          emptyText="Kullanıcı bulunamadı"
        />
      </div>

      {/* Durum Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
        <label className="block text-sm font-medium text-neutral-200 mb-2">Durum</label>
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

      {/* Tarih Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
        <label className="block text-sm font-medium text-neutral-200 mb-2">Tarih Aralığı</label>
        <select
          value={periodFilter}
          onChange={(e) => updateFilter("period", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        >
          <option value="all">Tümü</option>
          <option value="today">Bugün</option>
          <option value="yesterday">Dün</option>
          <option value="last_7days">Son 7 Gün</option>
          <option value="last_30days">Son 30 Gün</option>
          <option value="last_90days">Son 90 Gün</option>
        </select>
      </div>

      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4">
        <label className="block text-sm font-medium text-neutral-200 mb-2">Ödeme Aksiyonu</label>
        <select
          value={attentionFilter}
          onChange={(e) => updateFilter("attention", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        >
          <option value="all">Tümü</option>
          <option value="requires_action">Aksiyon Gerekli</option>
          <option value="retry_overdue">Retry Gecikmiş</option>
          <option value="retry_due">24 Saat İçinde Retry</option>
        </select>
      </div>
    </div>
  );
}

