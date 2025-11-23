"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { BillingPeriod } from "@/types/app";
import { RenewalPolicy } from "@/types/plan";
import AppFilterClient from "./AppFilterClient";
import type { AppDto } from "@/types/app";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function AdvancedFilters({ 
  apps, 
  appId 
}: { 
  apps: AppDto[]; 
  appId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.set("page", "1");
    router.push(`/plans?${params.toString()}`);
  };

  const billingPeriodFilter = searchParams.get("billingPeriod") ?? "all";
  const renewalPolicyFilter = searchParams.get("renewalPolicy") ?? "all";
  const trialDaysFilter = searchParams.get("trialDays") ?? "all";
  const isFreeFilter = searchParams.get("isFree") ?? "all";
  const isPublicFilter = searchParams.get("isPublic") ?? "all";

  return (
    <div className={cn(components.card, "p-4")}>
      <h3 className={cn("text-sm font-semibold mb-4", text.primary)}>Gelişmiş Filtreler</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Uygulama Filtresi */}
        {!appId && (
          <div>
            <label className={cn("block text-xs font-medium mb-2", text.muted)}>Uygulama</label>
            <AppFilterClient apps={apps} currentAppId={appId} />
          </div>
        )}

        {/* Faturalama Dönemi */}
        <div>
          <label className={cn("block text-xs font-medium mb-2", text.muted)}>Faturalama Dönemi</label>
          <select
            value={billingPeriodFilter}
            onChange={(e) => updateFilter("billingPeriod", e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              "bg-neutral-800 border border-neutral-700",
              "text-sm text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="all">Tümü</option>
            <option value={BillingPeriod.OneTime}>Tek Seferlik</option>
            <option value={BillingPeriod.Daily}>Günlük</option>
            <option value={BillingPeriod.Weekly}>Haftalık</option>
            <option value={BillingPeriod.Monthly}>Aylık</option>
            <option value={BillingPeriod.Yearly}>Yıllık</option>
          </select>
        </div>

        {/* Yenileme Politikası */}
        <div>
          <label className={cn("block text-xs font-medium mb-2", text.muted)}>Yenileme Politikası</label>
          <select
            value={renewalPolicyFilter}
            onChange={(e) => updateFilter("renewalPolicy", e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              "bg-neutral-800 border border-neutral-700",
              "text-sm text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="all">Tümü</option>
            <option value={RenewalPolicy.None}>Yok</option>
            <option value={RenewalPolicy.Manual}>Manuel</option>
            <option value={RenewalPolicy.Auto}>Otomatik</option>
          </select>
        </div>

        {/* Deneme Günü */}
        <div>
          <label className={cn("block text-xs font-medium mb-2", text.muted)}>Deneme Günü</label>
          <select
            value={trialDaysFilter}
            onChange={(e) => updateFilter("trialDays", e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              "bg-neutral-800 border border-neutral-700",
              "text-sm text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="all">Tümü</option>
            <option value="none">Deneme Yok (0 gün)</option>
            <option value="short">Kısa (1-7 gün)</option>
            <option value="medium">Orta (8-30 gün)</option>
            <option value="long">Uzun (30+ gün)</option>
          </select>
        </div>

        {/* Ücretsiz/Ücretli */}
        <div>
          <label className={cn("block text-xs font-medium mb-2", text.muted)}>Ücret Durumu</label>
          <select
            value={isFreeFilter}
            onChange={(e) => updateFilter("isFree", e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              "bg-neutral-800 border border-neutral-700",
              "text-sm text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="all">Tümü</option>
            <option value="free">Ücretsiz</option>
            <option value="paid">Ücretli</option>
          </select>
        </div>

        {/* Herkese Açık/Gizli */}
        <div>
          <label className={cn("block text-xs font-medium mb-2", text.muted)}>Görünürlük</label>
          <select
            value={isPublicFilter}
            onChange={(e) => updateFilter("isPublic", e.target.value)}
            className={cn(
              "w-full px-3 py-2 rounded-lg",
              "bg-neutral-800 border border-neutral-700",
              "text-sm text-white",
              "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            )}
          >
            <option value="all">Tümü</option>
            <option value="public">Herkese Açık</option>
            <option value="private">Gizli</option>
          </select>
        </div>
      </div>
    </div>
  );
}

