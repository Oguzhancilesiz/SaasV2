"use client";

import type { AppDto } from "@/types/app";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, Key, Calendar, Shield } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { createApiKey } from "@/lib/apikeysService";

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
    name: "",
    prefix: "",
    scopes: "",
    expiresAt: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.name) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        await createApiKey({
          appId: formData.appId,
          name: formData.name.trim(),
          prefix: formData.prefix.trim() || "",
          hash: "", // Backend boş gelirse otomatik oluşturuyor
          scopes: formData.scopes.trim() || "",
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        });
        
        notifySuccess("Başarılı", "API anahtarı oluşturuldu");
        router.push(`/apikeys?appId=${formData.appId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "API anahtarı oluşturulamadı";
        setErr(errorMessage);
        notifyError("Oluşturma başarısız", errorMessage);
      }
    });
  };

  // Tarih formatı için min değeri bugün yap
  const today = new Date().toISOString().split('T')[0];

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
          <Key className="w-4 h-4" />
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
          API anahtarının hangi uygulama için oluşturulacağını seçin
        </p>
      </div>

      {/* Ad */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Anahtar Adı *</label>
        <InputBase
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          placeholder="örn: Production API Key, Mobile App Key"
        />
        <p className={cn("text-xs", text.muted)}>
          Bu anahtarı tanımlamak için bir isim verin
        </p>
      </div>

      {/* Prefix */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Prefix (Opsiyonel)</label>
        <InputBase
          value={formData.prefix}
          onChange={(e) => setFormData({ ...formData, prefix: e.target.value.toUpperCase() })}
          placeholder="örn: PROD, MOBILE, TEST"
          maxLength={20}
        />
        <p className={cn("text-xs", text.muted)}>
          API anahtarının başında görünecek prefix. Boş bırakılırsa otomatik oluşturulur.
        </p>
      </div>

      {/* Scopes */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Shield className="w-4 h-4" />
          Scopes (Opsiyonel)
        </label>
        <TextareaBase
          value={formData.scopes}
          onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
          placeholder="örn: read:subscriptions,write:invoices,read:users"
        />
        <p className={cn("text-xs", text.muted)}>
          Bu anahtarın erişebileceği yetkileri virgülle ayırarak belirtin. Boş bırakılırsa tüm yetkilere sahip olur.
        </p>
      </div>

      {/* Bitiş Tarihi */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Calendar className="w-4 h-4" />
          Bitiş Tarihi (Opsiyonel)
        </label>
        <InputBase
          type="datetime-local"
          value={formData.expiresAt}
          onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          min={today}
        />
        <p className={cn("text-xs", text.muted)}>
          API anahtarının ne zaman sona ereceğini belirtin. Boş bırakılırsa süresiz olur.
        </p>
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
          {pending ? "Oluşturuluyor..." : "API Anahtarı Oluştur"}
        </button>

        <a
          href="/apikeys"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

