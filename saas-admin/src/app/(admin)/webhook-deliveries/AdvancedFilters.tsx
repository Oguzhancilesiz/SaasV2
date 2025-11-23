"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Status } from "@/types/app";
import SearchableSelect from "../subscriptions/SearchableSelect";
import type { WebhookEndpointDto } from "@/lib/webhooksService";

export default function AdvancedFilters({ endpoints }: { endpoints: WebhookEndpointDto[] }) {
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
  const endpointIdFilter = searchParams.get("webhookEndpointId") || "";
  const eventTypeFilter = searchParams.get("eventType") || "";

  // Unique event types
  const eventTypes = Array.from(new Set(endpoints.flatMap(e => 
    e.eventTypesCsv ? e.eventTypesCsv.split(',').map(t => t.trim()) : []
  ))).filter(Boolean);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
      {/* Webhook Endpoint Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 2 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Webhook Endpoint</label>
        <SearchableSelect
          options={endpoints}
          value={endpointIdFilter}
          onChange={(value) => updateFilter("webhookEndpointId", value)}
          getLabel={(endpoint) => `${endpoint.url.substring(0, 40)}...`}
          getValue={(endpoint) => endpoint.id}
          placeholder="Tüm Endpoint'ler"
          searchPlaceholder="Endpoint ara..."
          emptyText="Endpoint bulunamadı"
        />
      </div>

      {/* Event Type Filtresi */}
      <div className="bg-neutral-900/60 backdrop-blur-md border border-neutral-800/50 rounded-2xl shadow-lg shadow-black/20 p-4 relative" style={{ zIndex: 1 }}>
        <label className="block text-sm font-medium text-neutral-200 mb-2">Event Type</label>
        <select
          value={eventTypeFilter}
          onChange={(e) => updateFilter("eventType", e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800/50 text-sm text-neutral-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all"
        >
          <option value="">Tüm Event'ler</option>
          {eventTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
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
    </div>
  );
}

