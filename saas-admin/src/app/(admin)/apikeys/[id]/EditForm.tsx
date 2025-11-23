"use client";

import type { ApiKeyDto, ApiKeyUpdateDto } from "@/types/apikey";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, Key, Calendar, Shield, Eye, EyeOff, Copy } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { updateApiKey } from "@/lib/apikeysService";

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

export default function EditForm({ apiKey: initialApiKey }: { apiKey: ApiKeyDto }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [showKey, setShowKey] = useState(false);

  const [formData, setFormData] = useState({
    name: initialApiKey.name,
    scopes: initialApiKey.scopes || "",
    expiresAt: initialApiKey.expiresAt 
      ? new Date(initialApiKey.expiresAt).toISOString().slice(0, 16)
      : "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.name) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        const updateData: ApiKeyUpdateDto = {
          id: initialApiKey.id,
          name: formData.name.trim(),
          scopes: formData.scopes.trim() || "",
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        };
        
        await updateApiKey(initialApiKey.id, updateData);
        
        notifySuccess("Başarılı", "API anahtarı güncellendi");
        router.push(`/apikeys?appId=${initialApiKey.appId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "API anahtarı güncellenemedi";
        setErr(errorMessage);
        notifyError("Güncelleme başarısız", errorMessage);
      }
    });
  };

  const fullKey = `${initialApiKey.prefix}_${initialApiKey.hash}`;
  const displayKey = showKey 
    ? fullKey 
    : `${initialApiKey.prefix}_${'•'.repeat(Math.min(initialApiKey.hash.length, 32))}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifySuccess("Kopyalandı", "API anahtarı panoya kopyalandı");
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleString("tr-TR", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const isExpired = initialApiKey.expiresAt && new Date(initialApiKey.expiresAt) < new Date();
  const isActive = initialApiKey.status === 1;

  // Tarih formatı için min değeri bugün yap
  const today = new Date().toISOString().slice(0, 16);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "max-w-2xl space-y-6",
        components.card,
        "p-6 sm:p-8"
      )}
    >
      {/* API Key Bilgileri (Read-only) */}
      <div className={cn(
        "p-4 rounded-lg border",
        "bg-neutral-800/30 border-neutral-700/30"
      )}>
        <label className={cn("block text-sm font-medium mb-2 flex items-center gap-2", text.secondary)}>
          <Key className="w-4 h-4" />
          API Anahtarı
        </label>
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-mono text-sm px-3 py-2 rounded-lg flex-1",
            "bg-neutral-900/50 border border-neutral-700/50",
            text.tertiary
          )}>
            {displayKey}
          </span>
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className={cn(
              "p-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-neutral-800/70",
              "border border-neutral-700/50",
              "text-neutral-400 hover:text-white",
              "transition-all"
            )}
            title={showKey ? "Gizle" : "Göster"}
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(fullKey)}
            className={cn(
              "p-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-blue-500/20",
              "border border-neutral-700/50 hover:border-blue-500/30",
              "text-neutral-400 hover:text-blue-400",
              "transition-all"
            )}
            title="Tam Anahtarı Kopyala"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 space-y-1 text-xs">
          <div className={cn("flex items-center justify-between", text.muted)}>
            <span>Durum:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              isActive && !isExpired
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : isExpired
                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50"
            )}>
              {isActive && !isExpired ? "Aktif" : isExpired ? "Süresi Dolmuş" : "Pasif"}
            </span>
          </div>
          <div className={cn("flex items-center justify-between", text.muted)}>
            <span>Oluşturulma:</span>
            <span>{formatDate(initialApiKey.createdDate)}</span>
          </div>
          {initialApiKey.lastUsedAt && (
            <div className={cn("flex items-center justify-between", text.muted)}>
              <span>Son Kullanım:</span>
              <span>{formatDate(initialApiKey.lastUsedAt)}</span>
            </div>
          )}
        </div>
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

      {/* Scopes */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Shield className="w-4 h-4" />
          Scopes *
        </label>
        <TextareaBase
          value={formData.scopes}
          onChange={(e) => setFormData({ ...formData, scopes: e.target.value })}
          placeholder="örn: read:subscriptions,write:invoices,read:users"
          required
        />
        <p className={cn("text-xs", text.muted)}>
          Bu anahtarın erişebileceği yetkileri virgülle ayırarak belirtin
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
        {initialApiKey.expiresAt && (
          <p className={cn("text-xs", isExpired ? "text-red-400" : text.muted)}>
            Mevcut bitiş tarihi: {formatDate(initialApiKey.expiresAt)}
            {isExpired && " (Süresi dolmuş)"}
          </p>
        )}
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
          {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
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

