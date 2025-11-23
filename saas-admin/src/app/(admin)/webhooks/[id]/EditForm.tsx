"use client";

import type { WebhookEndpointDto, WebhookEndpointUpdateDto } from "@/lib/webhooksService";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, Webhook, Link2, Shield, Zap, Eye, EyeOff, Copy, RefreshCw, Play, Power } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { 
  updateWebhookEndpoint,
  activateWebhookEndpoint,
  deactivateWebhookEndpoint,
  rotateSecretWebhookEndpoint,
  testPingWebhookEndpoint
} from "@/lib/webhooksService";

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

export default function EditForm({ webhook: initialWebhook }: { webhook: WebhookEndpointDto }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [showSecret, setShowSecret] = useState(false);
  const [webhook, setWebhook] = useState<WebhookEndpointDto>(initialWebhook);

  const [formData, setFormData] = useState({
    url: initialWebhook.url,
    secret: initialWebhook.secret || "",
    isActive: initialWebhook.isActive,
    eventTypesCsv: initialWebhook.eventTypesCsv || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.url || !formData.secret || !formData.eventTypesCsv) {
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
        const updateData: WebhookEndpointUpdateDto = {
          id: initialWebhook.id,
          url: formData.url.trim(),
          secret: formData.secret.trim(),
          isActive: formData.isActive,
          eventTypesCsv: formData.eventTypesCsv.trim(),
        };
        
        await updateWebhookEndpoint(initialWebhook.id, updateData);
        
        notifySuccess("Başarılı", "Webhook endpoint güncellendi");
        router.push(`/webhooks?appId=${initialWebhook.appId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Webhook endpoint güncellenemedi";
        setErr(errorMessage);
        notifyError("Güncelleme başarısız", errorMessage);
      }
    });
  };

  const handleToggleActive = async () => {
    start(async () => {
      try {
        if (webhook.isActive) {
          await deactivateWebhookEndpoint(webhook.id);
          setWebhook({ ...webhook, isActive: false });
          setFormData({ ...formData, isActive: false });
          notifySuccess("Başarılı", "Webhook endpoint pasif edildi");
        } else {
          await activateWebhookEndpoint(webhook.id);
          setWebhook({ ...webhook, isActive: true });
          setFormData({ ...formData, isActive: true });
          notifySuccess("Başarılı", "Webhook endpoint aktif edildi");
        }
      } catch (error: any) {
        notifyError("Hata", error?.message || "İşlem başarısız");
      }
    });
  };

  const handleRotateSecret = async () => {
    start(async () => {
      try {
        await rotateSecretWebhookEndpoint(webhook.id);
        notifySuccess("Başarılı", "Secret yenilendi");
        // Reload webhook data
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Secret yenilenemedi");
      }
    });
  };

  const handleTestPing = async () => {
    start(async () => {
      try {
        await testPingWebhookEndpoint(webhook.id);
        notifySuccess("Başarılı", "Test ping başarıyla gönderildi ve endpoint 200 OK döndü");
      } catch (error: any) {
        const errorMessage = error?.message || "Test ping gönderilemedi";
        // 422 gibi hatalar normal olabilir - endpoint çalışıyor ama payload'ı kabul etmiyor
        if (errorMessage.includes("422")) {
          notifyError("Uyarı", "Endpoint'e ping gönderildi ancak 422 (Unprocessable Entity) döndü. Bu normal olabilir - endpoint çalışıyor ancak test payload'ını kabul etmiyor.");
        } else if (errorMessage.includes("404")) {
          notifyError("Hata", "Endpoint bulunamadı (404). URL'yi kontrol edin.");
        } else if (errorMessage.includes("500")) {
          notifyError("Hata", "Endpoint sunucu hatası döndü (500). Endpoint'in çalıştığından emin olun.");
        } else {
          notifyError("Hata", errorMessage);
        }
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifySuccess("Kopyalandı", "Panoya kopyalandı");
  };

  const formatDateTime = (dateString: string | null): string => {
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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "max-w-2xl space-y-6",
        components.card,
        "p-6 sm:p-8"
      )}
    >
      {/* Webhook Bilgileri (Read-only) */}
      <div className={cn(
        "p-4 rounded-lg border",
        "bg-neutral-800/30 border-neutral-700/30"
      )}>
        <label className={cn("block text-sm font-medium mb-2 flex items-center gap-2", text.secondary)}>
          <Webhook className="w-4 h-4" />
          Webhook Endpoint Bilgileri
        </label>
        <div className="space-y-2 text-xs">
          <div className={cn("flex items-center justify-between", text.muted)}>
            <span>Durum:</span>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              webhook.status === 1
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-neutral-800/50 text-neutral-400 border border-neutral-700/50"
            )}>
              {webhook.status === 1 ? "Aktif" : "Pasif"}
            </span>
          </div>
          <div className={cn("flex items-center justify-between", text.muted)}>
            <span>Oluşturulma:</span>
            <span>{formatDateTime(webhook.createdDate)}</span>
          </div>
          <div className={cn("flex items-center justify-between", text.muted)}>
            <span>Son Güncelleme:</span>
            <span>{formatDateTime(webhook.modifiedDate)}</span>
          </div>
        </div>
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
          Secret *
        </label>
        <div className="flex items-center gap-2">
          <InputBase
            type={showSecret ? "text" : "password"}
            value={formData.secret}
            onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
            required
            placeholder="Webhook secret key"
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className={cn(
              "p-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-neutral-800/70",
              "border border-neutral-700/50",
              "text-neutral-400 hover:text-white",
              "transition-all"
            )}
            title={showSecret ? "Gizle" : "Göster"}
          >
            {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(formData.secret)}
            className={cn(
              "p-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-blue-500/20",
              "border border-neutral-700/50 hover:border-blue-500/30",
              "text-neutral-400 hover:text-blue-400",
              "transition-all"
            )}
            title="Secret'ı Kopyala"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleRotateSecret}
            disabled={pending}
            className={cn(
              "p-2 rounded-lg",
              "bg-yellow-500/10 hover:bg-yellow-500/20",
              "border border-yellow-500/20",
              "text-yellow-400 hover:text-yellow-300",
              "transition-all",
              pending && "opacity-50 cursor-not-allowed"
            )}
            title="Secret'ı Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <p className={cn("text-xs", text.muted)}>
          Webhook isteklerini doğrulamak için kullanılacak secret key
        </p>
      </div>

      {/* Event Types */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Zap className="w-4 h-4" />
          Event Types *
        </label>
        <TextareaBase
          value={formData.eventTypesCsv}
          onChange={(e) => setFormData({ ...formData, eventTypesCsv: e.target.value })}
          placeholder="subscription.created,subscription.updated,invoice.paid"
          required
        />
        <p className={cn("text-xs", text.muted)}>
          Bu endpoint'in dinleyeceği event tiplerini virgülle ayırarak belirtin
        </p>
      </div>

      {/* Is Active */}
      <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-700/30 bg-neutral-800/30">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-5 h-5 rounded border-neutral-700 bg-neutral-800 text-blue-500 focus:ring-2 focus:ring-blue-500/20"
          />
          <label className={cn("text-sm", text.secondary)}>
            Aktif - Webhook'lar gönderilir
          </label>
        </div>
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={pending}
          className={cn(
            "px-3 py-2 rounded-lg text-xs font-medium",
            webhook.isActive
              ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
              : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
            "hover:opacity-80 transition-all",
            "flex items-center gap-1.5",
            pending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Power className="w-3.5 h-3.5" />
          {webhook.isActive ? "Pasif Et" : "Aktif Et"}
        </button>
      </div>

      {/* Test Ping */}
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleTestPing}
          disabled={pending}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium",
            "bg-purple-500/10 text-purple-400 border border-purple-500/20",
            "hover:bg-purple-500/20 transition-all",
            "flex items-center gap-2",
            pending && "opacity-50 cursor-not-allowed"
          )}
        >
          <Play className="w-4 h-4" />
          Test Ping Gönder
        </button>
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

