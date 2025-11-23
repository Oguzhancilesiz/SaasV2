"use client";

import type { AppDto } from "@/types/app";
import { useRouter } from "next/navigation";
import { components } from "@/lib/theme";

export default function AppFilterClient({ apps, currentAppId }: { apps: AppDto[]; currentAppId?: string }) {
  const router = useRouter();

  return (
    <select
      defaultValue={currentAppId || ""}
      onChange={(e) => {
        const url = e.target.value ? `/plans?appId=${e.target.value}` : "/plans";
        router.push(url);
      }}
      className={components.input}
    >
      <option value="">Tüm Uygulamalar</option>
      {apps.map((app) => (
        <option key={app.id} value={app.id}>
          {app.name} ({app.code})
        </option>
      ))}
    </select>
  );
}

