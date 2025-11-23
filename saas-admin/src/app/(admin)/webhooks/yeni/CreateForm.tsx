"use client";

import type { AppDto } from "@/types/app";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, Webhook, Link2, Shield, Zap } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { createWebhookEndpoint } from "@/lib/webhooksService";

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(components.input, "min-h-[100px] resize-none", props.className)}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(components.input, props.className)} />
  );
}

export default function CreateForm({ apps, defaultAppId }: { apps: AppDto[]; defaultAppId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    appId: defaultAppId || "",
    url: "",
    secret: "",
    isActive: true,
    eventTypesCsv: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.url) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    // URL validation
    try {
      new URL(formData.url);
    } catch {
      setErr("Geçerli bir URL giriniz.");
      return;
    }

    start(async () => {
      try {
        const webhookData: any = {
          appId: formData.appId,
          url: formData.url.trim(),
          isActive: formData.isActive,
        };
        
        // Secret boş değilse ekle, backend otomatik oluşturuyor
        if (formData.secret.trim()) {
          webhookData.secret = formData.secret.trim();
        }
        
        // EventTypesCsv boş değilse ekle
        if (formData.eventTypesCsv.trim()) {
          webhookData.eventTypesCsv = formData.eventTypesCsv.trim();
        }
        
        await createWebhookEndpoint(webhookData);
        
        notifySuccess("Başarılı", "Webhook endpoint oluşturuldu");
        router.push(`/webhooks?appId=${formData.appId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Webhook endpoint oluşturulamadı";
        setErr(errorMessage);
        notifyError("Oluşturma başarısız", errorMessage);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "max-w-2xl space-y-6",
        components.card,
        "p-6 sm:p-8"
      )}
    >
      {/* Uygulama Seçimi */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Webhook className="w-4 h-4" />
          Uygulama *
        </label>
        <SelectBase
          value={formData.appId}
          onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
          required
        >
          <option value="">Uygulama seçin</option>
          {apps.map((app) => (
            <option key={app.id} value={app.id}>
              {app.name} ({app.code})
            </option>
          ))}
        </SelectBase>
        <p className={cn("text-xs", text.muted)}>
          Webhook endpoint'inin hangi uygulama için oluşturulacağını seçin
        </p>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Link2 className="w-4 h-4" />
          URL *
        </label>
        <InputBase
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          required
          placeholder="https://example.com/webhook"
        />
        <p className={cn("text-xs", text.muted)}>
          Webhook'ların gönderileceği endpoint URL'i
        </p>
      </div>

      {/* Secret */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Shield className="w-4 h-4" />
          Secret (Opsiyonel)
        </label>
        <InputBase
          type="password"
          value={formData.secret}
          onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
          placeholder="Webhook secret key"
        />
        <p className={cn("text-xs", text.muted)}>
          Webhook isteklerini doğrulamak için kullanılacak secret key
        </p>
      </div>

      {/* Event Types */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Zap className="w-4 h-4" />
          Event Types (Opsiyonel)
        </label>
        <TextareaBase
          value={formData.eventTypesCsv}
          onChange={(e) => setFormData({ ...formData, eventTypesCsv: e.target.value })}
          placeholder="subscription.created,subscription.updated,invoice.paid"
        />
        <p className={cn("text-xs", text.muted)}>
          Bu endpoint'in dinleyeceği event tiplerini virgülle ayırarak belirtin. Boş bırakılırsa tüm event'leri dinler.
        </p>
      </div>

      {/* Is Active */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
        />
        <label className={cn("text-sm", text.secondary)}>
          Aktif - Webhook'lar hemen gönderilmeye başlanır
        </label>
      </div>

      {err && (
        <div className={cn(
          "p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"
        )}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {err}
        </div>
      )}

      <div className="flex items-center gap-3 pt-4 border-t border-neutral-800/50">
        <button
          type="submit"
          className={cn(components.buttonPrimary, "flex-1 min-w-[140px] disabled:opacity-50")}
          disabled={pending}
        >
          <Save className="w-4 h-4" />
          {pending ? "Oluşturuluyor..." : "Webhook Endpoint Oluştur"}
        </button>

        <a
          href="/webhooks"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

