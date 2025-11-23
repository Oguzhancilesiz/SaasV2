"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { Filter, X } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AdvancedFilters({
  apps,
  users,
  selectedAppId,
  selectedUserId,
  selectedAction,
  selectedEntityType,
  actions,
  entityTypes,
  sortKey,
}: {
  apps: AppDto[];
  users: UserDto[];
  selectedAppId?: string;
  selectedUserId?: string;
  selectedAction?: string;
  selectedEntityType?: string;
  actions: string[];
  entityTypes: string[];
  sortKey?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showFilters, setShowFilters] = useState(
    !!selectedAppId || !!selectedUserId || selectedAction !== "all" || selectedEntityType !== "all"
  );

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // Reset to page 1
    router.push(`/activity-logs?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/activity-logs");
  };

  const hasActiveFilters = selectedAppId || selectedUserId || selectedAction !== "all" || selectedEntityType !== "all";

  return (
    <div className={cn(components.card, "p-4 sm:p-6")}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "flex items-center gap-2 text-sm font-medium",
            text.secondary,
            "hover:text-white transition-colors"
          )}
        >
          <Filter className="w-4 h-4" />
          {showFilters ? "Filtreleri Gizle" : "Filtreleri Göster"}
        </button>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className={cn(
              "text-xs px-3 py-1.5 rounded-lg",
              "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20",
              "transition-all flex items-center gap-1"
            )}
          >
            <X className="w-3 h-3" />
            Temizle
          </button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Uygulama</label>
            <select
              value={selectedAppId || ""}
              onChange={(e) => updateFilter("appId", e.target.value)}
              className={components.input}
            >
              <option value="">Tüm Uygulamalar</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name} ({app.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Kullanıcı</label>
            <select
              value={selectedUserId || ""}
              onChange={(e) => updateFilter("userId", e.target.value)}
              className={components.input}
            >
              <option value="">Tüm Kullanıcılar</option>
              {users.map((user) => (
                <option key={user.userId} value={user.userId}>
                  {user.email} ({user.userName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Aksiyon</label>
            <select
              value={selectedAction || "all"}
              onChange={(e) => updateFilter("action", e.target.value)}
              className={components.input}
            >
              <option value="all">Tüm Aksiyonlar</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Entity Tipi</label>
            <select
              value={selectedEntityType || "all"}
              onChange={(e) => updateFilter("entityType", e.target.value)}
              className={components.input}
            >
              <option value="all">Tüm Entity Tipleri</option>
              {entityTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={cn("block text-sm font-medium mb-2", text.secondary)}>Sıralama</label>
            <select
              value={sortKey || "created_desc"}
              onChange={(e) => updateFilter("sort", e.target.value)}
              className={components.input}
            >
              <option value="created_desc">Tarih (Yeni → Eski)</option>
              <option value="created_asc">Tarih (Eski → Yeni)</option>
              <option value="action_asc">Aksiyon (A → Z)</option>
              <option value="entity_asc">Entity (A → Z)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

