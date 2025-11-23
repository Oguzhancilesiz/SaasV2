"use client";

import { useState, useTransition } from "react";
import type { OutboxMessageDto } from "@/lib/outboxService";
import type { AppDto } from "@/types/app";
import { Status } from "@/types/app";
import { 
  Inbox, Eye, ChevronDown, ChevronUp, 
  CheckCircle2, XCircle, Clock, RefreshCw, Trash2
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { markOutboxMessageProcessed, incrementOutboxMessageRetry, deleteOutboxMessage } from "@/lib/outboxService";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import Pagination from "@/components/filters/Pagination";
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
function formatDateTime(dateString: string | null): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleString("tr-TR", { 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

// Outbox Message görüntüleme modalı
function OutboxMessageViewModal({ 
  message, 
  app,
  isOpen, 
  onClose 
}: { 
  message: OutboxMessageDto | null;
  app?: AppDto;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !message) return null;

  const isProcessed = message.processedAt != null;
  const statusStyles = getStatusStyles(message.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={cn(
        "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
        "w-full max-w-3xl max-h-[90vh] overflow-y-auto"
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              isProcessed ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
            )}>
              {isProcessed ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", text.primary)}>Outbox Mesaj Detayları</h2>
              <p className={cn("text-sm", text.muted)}>Type: {message.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg hover:bg-neutral-800 transition-colors",
              text.muted
            )}
          >
            <ChevronUp className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", text.secondary)}>Durum:</span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              statusStyles.bg,
              statusStyles.text,
              statusStyles.border,
              "border"
            )}>
              {getStatusLabel(message.status)}
            </span>
            {isProcessed ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                İşlenmiş
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                Bekliyor
              </span>
            )}
            {message.retries > 0 && (
              <span className={cn("text-xs", text.muted)}>
                ({message.retries} yeniden deneme)
              </span>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Uygulama</div>
              <div className={cn("text-sm", text.primary)}>
                {app ? `${app.name} (${app.code})` : message.appId ? message.appId.substring(0, 8) : "Global"}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Type</div>
              <div className={cn("text-sm font-semibold", text.primary)}>
                {message.type}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşma Zamanı</div>
              <div className={cn("text-xs", text.primary)}>
                {formatDateTime(message.occurredAt)}
              </div>
            </div>
            {message.processedAt && (
              <div>
                <div className={cn("text-xs font-medium mb-1", text.muted)}>İşlenme Zamanı</div>
                <div className={cn("text-xs", text.primary)}>
                  {formatDateTime(message.processedAt)}
                </div>
              </div>
            )}
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşturulma</div>
              <div className={cn("text-xs", text.primary)}>
                {formatDateTime(message.createdDate)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Yeniden Deneme</div>
              <div className={cn("text-sm font-semibold", text.primary)}>
                {message.retries}
              </div>
            </div>
          </div>

          {/* Payload */}
          <div>
            <div className={cn("text-xs font-medium mb-1", text.muted)}>Payload</div>
            <pre className={cn(
              "text-xs p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto",
              text.primary
            )}>
              {JSON.stringify(JSON.parse(message.payload), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OutboxListClient({ 
  messages, 
  apps,
  searchQuery,
  appId,
  type,
  pending,
  pagination
}: { 
  messages: OutboxMessageDto[];
  apps: AppDto[];
  searchQuery: string;
  appId?: string;
  type?: string;
  pending?: boolean;
  pagination?: PaginationInfo;
}) {
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [viewingMessage, setViewingMessage] = useState<OutboxMessageDto | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string } | null>(null);
  const [, startTransition] = useTransition();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const toggleExpand = (id: string) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleMarkProcessed = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await markOutboxMessageProcessed(id);
        notifySuccess("Başarılı", "Mesaj işlenmiş olarak işaretlendi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Mesaj işaretlenemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleIncrementRetry = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        const retries = await incrementOutboxMessageRetry(id);
        notifySuccess("Başarılı", `Yeniden deneme sayısı: ${retries}`);
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Yeniden deneme artırılamadı");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleDelete = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteOutboxMessage(id);
        notifySuccess("Başarılı", "Mesaj silindi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Mesaj silinemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  if (messages.length === 0) {
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
            <Inbox className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId || type || pending !== undefined
              ? "Arama kriterlerinize uygun mesaj bulunamadı"
              : "Henüz outbox mesajı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {messages.map((message) => {
          const app = message.appId ? apps.find(a => a.id === message.appId) : undefined;
          const isExpanded = expandedMessages.has(message.id);
          const isProcessed = message.processedAt != null;
          const isPending = pendingId === message.id;
          const statusStyles = getStatusStyles(message.status);

          return (
            <article
              key={message.id}
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
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      isProcessed ? "bg-emerald-500/10 text-emerald-400" : "bg-orange-500/10 text-orange-400"
                    )}>
                      {isProcessed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("text-base font-semibold", text.primary)}>
                          {message.type}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles.bg,
                          statusStyles.text,
                          statusStyles.border,
                          "border"
                        )}>
                          {getStatusLabel(message.status)}
                        </span>
                        {isProcessed ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            İşlenmiş
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                            Bekliyor
                          </span>
                        )}
                        {message.retries > 0 && (
                          <span className={cn("text-xs", text.muted)}>
                            {message.retries} retry
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {app ? `${app.name} (${app.code})` : message.appId ? message.appId.substring(0, 8) : "Global"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingMessage(message)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-neutral-800/50 hover:bg-blue-500/20",
                      "border border-neutral-700/50 hover:border-blue-500/30",
                      "text-neutral-400 hover:text-blue-400",
                      "transition-all"
                    )}
                    title="Detayları Görüntüle"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleExpand(message.id)}
                    className={cn(
                      "p-2 rounded-lg",
                      "bg-neutral-800/50 hover:bg-neutral-800/70",
                      "border border-neutral-700/50",
                      "text-neutral-400 hover:text-white",
                      "transition-all"
                    )}
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="pt-4 border-t border-neutral-800/50 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşma Zamanı</div>
                      <div className={cn("text-xs", text.primary)}>
                        {formatDateTime(message.occurredAt)}
                      </div>
                    </div>
                    {message.processedAt && (
                      <div>
                        <div className={cn("text-xs font-medium mb-1", text.muted)}>İşlenme Zamanı</div>
                        <div className={cn("text-xs", text.primary)}>
                          {formatDateTime(message.processedAt)}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Yeniden Deneme</div>
                      <div className={cn("text-xs font-semibold", text.primary)}>
                        {message.retries}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşturulma</div>
                      <div className={cn("text-xs", text.primary)}>
                        {formatDateTime(message.createdDate)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs font-medium mb-1", text.muted)}>Payload (Önizleme)</div>
                    <pre className={cn(
                      "text-xs p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto max-h-32",
                      text.primary
                    )}>
                      {JSON.stringify(JSON.parse(message.payload), null, 2).substring(0, 300)}...
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-neutral-800/50">
                    {!isProcessed && (
                      <button
                        onClick={() => handleMarkProcessed(message.id)}
                        disabled={isPending}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium",
                          "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                          "hover:bg-emerald-500/20 transition-all",
                          "flex items-center gap-1.5",
                          isPending && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        İşlenmiş İşaretle
                      </button>
                    )}
                    {!isProcessed && (
                      <button
                        onClick={() => handleIncrementRetry(message.id)}
                        disabled={isPending}
                        className={cn(
                          "px-3 py-2 rounded-lg text-xs font-medium",
                          "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                          "hover:bg-orange-500/20 transition-all",
                          "flex items-center gap-1.5",
                          isPending && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Retry Artır
                      </button>
                    )}
                    <button
                      onClick={() => setShowDeleteDialog({ id: message.id })}
                      disabled={isPending}
                      className={cn(
                        "px-3 py-2 rounded-lg text-xs font-medium",
                        "bg-red-500/10 text-red-400 border border-red-500/20",
                        "hover:bg-red-500/20 transition-all",
                        "flex items-center gap-1.5",
                        isPending && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* View Modal */}
      <OutboxMessageViewModal
        message={viewingMessage}
        app={viewingMessage ? (viewingMessage.appId ? apps.find(a => a.id === viewingMessage.appId) : undefined) : undefined}
        isOpen={viewingMessage !== null}
        onClose={() => setViewingMessage(null)}
      />

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Outbox Mesajını Sil"
          message="Bu outbox mesajını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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

