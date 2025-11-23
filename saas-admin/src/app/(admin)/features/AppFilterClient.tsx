"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { components, text } from "@/lib/theme";
import type { AppDto } from "@/types/app";

export default function AppFilterClient({ apps, currentAppId }: { apps: AppDto[]; currentAppId?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
      params.set("page", "1");
      return params.toString();
    },
    [searchParams]
  );

  const handleAppChange = (appId: string) => {
    router.push(`${pathname}?${createQueryString("appId", appId)}`, { scroll: false });
  };

  return (
    <div className={cn(components.card, "p-4")}>
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.muted)}>Uygulama Filtresi</label>
        <select
          value={currentAppId || "all"}
          onChange={(e) => handleAppChange(e.target.value)}
          className={cn(
            "w-full px-3 py-2 rounded-lg",
            "bg-neutral-800 border border-neutral-700",
            "text-sm text-white",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          )}
        >
          <option value="all">Tüm Uygulamalar</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.code})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

