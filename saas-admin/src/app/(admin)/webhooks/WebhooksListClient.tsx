"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { WebhookEndpointDto } from "@/lib/webhooksService";
import type { AppDto } from "@/types/app";
import { Status } from "@/types/app";
import { 
  Webhook, Edit, Trash2, Copy, Eye, EyeOff, 
  Building2, Calendar, CheckCircle2, XCircle, 
  RefreshCw, Play, Power
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { 
  deleteWebhookEndpoint, 
  activateWebhookEndpoint, 
  deactivateWebhookEndpoint,
  rotateSecretWebhookEndpoint,
  testPingWebhookEndpoint
} from "@/lib/webhooksService";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import type { PaginationInfo } from "@/lib/filterUtils";

// Status değerini Türkçe label'a çeviren fonksiyon
function getStatusLabel(status: Status | number): string {
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return "Aktif";
    case Status.DeActive:
    case 2:
      return "Pasif";
    default:
      return `Bilinmeyen (${statusNum})`;
  }
}

// Status'e göre renk ve stil belirleyen fonksiyon
function getStatusStyles(status: Status | number) {
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
        dot: "bg-emerald-400"
      };
    case Status.DeActive:
    case 2:
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/20",
        dot: "bg-orange-400"
      };
    default:
      return {
        bg: "bg-neutral-800/50",
        text: "text-neutral-400",
        border: "border-neutral-700/50",
        dot: "bg-neutral-500"
      };
  }
}

// Date format
function formatDate(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default function WebhooksListClient({ 
  webhooks, 
  apps, 
  searchQuery,
  appId,
  pagination
}: { 
  webhooks: WebhookEndpointDto[];
  apps: AppDto[];
  searchQuery: string;
  appId?: string;
  pagination?: PaginationInfo;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; url: string } | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const handleDelete = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteWebhookEndpoint(id);
        notifySuccess("Başarılı", "Webhook endpoint silindi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Webhook endpoint silinemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleToggleActive = async (webhook: WebhookEndpointDto) => {
    setPendingId(webhook.id);
    startTransition(async () => {
      try {
        if (webhook.isActive) {
          await deactivateWebhookEndpoint(webhook.id);
          notifySuccess("Başarılı", "Webhook endpoint pasif edildi");
        } else {
          await activateWebhookEndpoint(webhook.id);
          notifySuccess("Başarılı", "Webhook endpoint aktif edildi");
        }
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "İşlem başarısız");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleRotateSecret = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await rotateSecretWebhookEndpoint(id);
        notifySuccess("Başarılı", "Secret yenilendi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Secret yenilenemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleTestPing = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await testPingWebhookEndpoint(id);
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
      } finally {
        setPendingId(null);
      }
    });
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notifySuccess("Kopyalandı", "Panoya kopyalandı");
  };

  if (webhooks.length === 0) {
    return (
      <div className={cn(
        "text-center py-12 sm:py-16 px-4",
        bg.card,
        "border",
        "rounded-2xl"
      )}>
        <div className="max-w-md mx-auto">
          <div className={cn(
            "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
            bg.button
          )}>
            <Webhook className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId
              ? "Arama kriterlerinize uygun webhook endpoint bulunamadı"
              : "Henüz webhook endpoint yok"}
          </h3>
          <p className={cn("text-sm mb-6", text.muted)}>
            {searchQuery || appId
              ? "Farklı arama terimleri deneyin veya filtreleri temizleyin"
              : "İlk webhook endpoint'inizi oluşturmak için yukarıdaki butona tıklayın"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {webhooks.map((webhook) => {
          const app = apps.find(a => a.id === webhook.appId);
          const isPending = pendingId === webhook.id;
          const isActive = webhook.status === 1;
          const isWebhookActive = webhook.isActive;
          const isVisible = visibleSecrets.has(webhook.id);
          const displaySecret = isVisible ? webhook.secret : '•'.repeat(Math.min(webhook.secret?.length || 0, 20));

          return (
            <article
              key={webhook.id}
              className={cn(
                components.card,
                "p-5 sm:p-6",
                "flex flex-col gap-4",
                isPending && "opacity-50"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isWebhookActive && isActive
                        ? "bg-emerald-500/10 text-emerald-400"
                        : "bg-neutral-800/50 text-neutral-400"
                    )}>
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-lg font-bold truncate", text.primary)}>
                        {webhook.url.length > 40 ? `${webhook.url.substring(0, 40)}...` : webhook.url}
                      </h3>
                      {app && (
                        <div className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{app.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* URL Display */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "font-mono text-xs px-3 py-1.5 rounded-lg",
                      "bg-neutral-800/50 border border-neutral-700/50",
                      "flex-1 truncate",
                      text.tertiary
                    )} title={webhook.url}>
                      {webhook.url}
                    </span>
                    <button
                      onClick={() => copyToClipboard(webhook.url)}
                      className={cn(
                        "p-1.5 rounded-lg",
                        "bg-neutral-800/50 hover:bg-blue-500/20",
                        "border border-neutral-700/50 hover:border-blue-500/30",
                        "text-neutral-400 hover:text-blue-400",
                        "transition-all"
                      )}
                      title="URL'yi Kopyala"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Secret */}
                  {webhook.secret && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "font-mono text-xs px-3 py-1.5 rounded-lg",
                        "bg-neutral-800/50 border border-neutral-700/50",
                        "flex-1 truncate",
                        text.tertiary
                      )}>
                        {displaySecret}
                      </span>
                      <button
                        onClick={() => toggleSecretVisibility(webhook.id)}
                        className={cn(
                          "p-1.5 rounded-lg",
                          "bg-neutral-800/50 hover:bg-neutral-800/70",
                          "border border-neutral-700/50",
                          "text-neutral-400 hover:text-white",
                          "transition-all"
                        )}
                        title={isVisible ? "Gizle" : "Göster"}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(webhook.secret)}
                        className={cn(
                          "p-1.5 rounded-lg",
                          "bg-neutral-800/50 hover:bg-blue-500/20",
                          "border border-neutral-700/50 hover:border-blue-500/30",
                          "text-neutral-400 hover:text-blue-400",
                          "transition-all"
                        )}
                        title="Secret'ı Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Event Types */}
                  {webhook.eventTypesCsv && (
                    <div className="text-xs mb-2">
                      <span className={cn("font-medium", text.muted)}>Event Types: </span>
                      <span className={cn(text.secondary)}>
                        {webhook.eventTypesCsv.split(',').slice(0, 3).join(', ')}
                        {webhook.eventTypesCsv.split(',').length > 3 && '...'}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-neutral-800/50 text-neutral-400 border-neutral-700/50"
                    )}
                  >
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-emerald-400" : "bg-neutral-500"
                    )} />
                    {getStatusLabel(webhook.status)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                      isWebhookActive
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                    )}
                  >
                    {isWebhookActive ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {isWebhookActive ? "Aktif" : "Pasif"}
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-neutral-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span suppressHydrationWarning>
                    Oluşturulma: {formatDateTime(webhook.createdDate)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800/50">
                <a
                  href={`/webhooks/${webhook.id}`}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                    "hover:bg-blue-500/20 transition-all",
                    "flex items-center gap-1.5"
                  )}
                  title="Düzenle"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Düzenle
                </a>
                
                <button
                  onClick={() => handleToggleActive(webhook)}
                  disabled={isPending}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    isWebhookActive
                      ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                    "hover:opacity-80 transition-all",
                    "flex items-center gap-1.5",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title={isWebhookActive ? "Pasif Et" : "Aktif Et"}
                >
                  <Power className="w-3.5 h-3.5" />
                  {isWebhookActive ? "Pasif" : "Aktif"}
                </button>

                <button
                  onClick={() => handleTestPing(webhook.id)}
                  disabled={isPending}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    "bg-purple-500/10 text-purple-400 border border-purple-500/20",
                    "hover:bg-purple-500/20 transition-all",
                    "flex items-center gap-1.5",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title="Test Ping"
                >
                  <Play className="w-3.5 h-3.5" />
                  Test
                </button>

                <button
                  onClick={() => handleRotateSecret(webhook.id)}
                  disabled={isPending}
                  className={cn(
                    "px-3 py-2 rounded-lg text-xs font-medium",
                    "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
                    "hover:bg-yellow-500/20 transition-all",
                    "flex items-center gap-1.5",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title="Secret'ı Yenile"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Secret
                </button>

                <button
                  onClick={() => setShowDeleteDialog({ id: webhook.id, url: webhook.url })}
                  disabled={isPending}
                  className={cn(
                    "px-3 py-2 rounded-lg",
                    "bg-red-500/10 text-red-400 border border-red-500/20",
                    "hover:bg-red-500/20 transition-all",
                    isPending && "opacity-50 cursor-not-allowed"
                  )}
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Webhook Endpoint'i Sil"
          message={`"${showDeleteDialog.url}" endpoint'ini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={() => {
            handleDelete(showDeleteDialog.id);
            setShowDeleteDialog(null);
          }}
          onCancel={() => setShowDeleteDialog(null)}
        />
      )}
    </>
  );
}

