"use client";

import { useEffect, useState } from "react";
import type { AppDashboardSummary } from "@/types/app";
import { getAppDashboard } from "./actions";
import { bg, border, text, radius, transition } from "@/lib/theme";
import { cn } from "@/lib/utils";

function money(amount?: number | null, cur?: string | null) {
  if (amount == null) return "—";
  const a = Number(amount);
  return `${a.toLocaleString("tr-TR")} ${cur ?? ""}`.trim();
}

export default function ExtrasClient({ appId }: { appId: string }) {
  const [data, setData] = useState<AppDashboardSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getAppDashboard(appId)
      .then((d) => {
        if (alive) {
          setData(d);
        }
      })
      .catch((e) => {
        if (alive) {
          setErr(e?.message || "Hata");
        }
      });
    return () => {
      alive = false;
    };
  }, [appId]);

  if (err) {
    return (
      <div className={cn(
        radius.md,
        "bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400"
      )}>
        {err}
      </div>
    );
  }

  if (!data) {
    return (
      <div className={cn(
        radius.md,
        bg.input,
        border.default,
        "border p-3 animate-pulse text-xs",
        text.muted
      )}>
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-2 gap-2 sm:gap-3 text-sm",
      radius.md,
      bg.input,
      border.default,
      "border p-3"
    )}>
      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Planlar</div>
        <div>
          <span className="text-emerald-400">{data.plansActive}</span> aktif ·{" "}
          <span className={text.tertiary}>{data.plansInactive}</span> pasif
        </div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Fiyat aralığı</div>
        <div>
          {money(data.cheapestPrice, data.cheapestPriceCurrency)} — {money(data.highestPrice, data.highestPriceCurrency)}
        </div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Abonelik</div>
        <div>
          {data.subscriptionsActive}/{data.subscriptionsTotal} aktif
        </div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Gelir (30g)</div>
        <div>{money(data.revenueLast30d, data.revenueCurrency)}</div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>API Anahtar</div>
        <div>
          {data.apiKeysActive > 0 ? (
            <>
              <span className="text-blue-400">{data.latestApiKeyMasked ?? "••••"}</span>{" "}
              <span className={cn("text-xs", text.muted)}>
                (son: {data.latestApiKeyCreated ? new Date(data.latestApiKeyCreated).toLocaleString("tr-TR") : "—"})
              </span>
            </>
          ) : (
            <span className={text.disabled}>Yok</span>
          )}
        </div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Webhook</div>
        <div>
          {data.webhookEndpointsActive} aktif · {data.lastWebhookDeliveryAt ? new Date(data.lastWebhookDeliveryAt).toLocaleString("tr-TR") : "—"}{" "}
          <span className={cn("text-xs", text.muted)}>{data.lastWebhookDeliveryStatus ?? ""}</span>
        </div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Kullanım (7g)</div>
        <div>{data.usageEventsLast7d.toLocaleString("tr-TR")}</div>
      </div>

      <div>
        <div className={cn("text-[11px] uppercase tracking-wide mb-1", text.muted)}>Kayıt (7g)</div>
        <div>{data.registrationsLast7d.toLocaleString("tr-TR")}</div>
      </div>
    </div>
  );
}
