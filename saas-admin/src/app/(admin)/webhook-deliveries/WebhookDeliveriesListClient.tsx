"use client";

import { useState } from "react";
import type { WebhookDeliveryDto } from "@/lib/webhookDeliveriesService";
import type { WebhookEndpointDto } from "@/lib/webhooksService";
import { Status } from "@/types/app";
import { 
  Send, Eye, ChevronDown, ChevronUp, 
  CheckCircle2, XCircle, AlertCircle, Clock
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
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

// Response status'a göre label
function getResponseStatusLabel(status: number): string {
  if (status === 0) return "Timeout/Hata";
  if (status >= 200 && status < 300) return "Başarılı";
  if (status >= 300 && status < 400) return "Yönlendirme";
  if (status >= 400 && status < 500) return "İstemci Hatası";
  if (status >= 500) return "Sunucu Hatası";
  return `Bilinmeyen (${status})`;
}

// Response status'a göre renk
function getResponseStatusStyles(status: number) {
  if (status === 0) {
    return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      icon: XCircle
    };
  }
  if (status >= 200 && status < 300) {
    return {
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      icon: CheckCircle2
    };
  }
  if (status >= 400 && status < 500) {
    return {
      bg: "bg-orange-500/10",
      text: "text-orange-400",
      border: "border-orange-500/20",
      icon: AlertCircle
    };
  }
  if (status >= 500) {
    return {
      bg: "bg-red-500/10",
      text: "text-red-400",
      border: "border-red-500/20",
      icon: XCircle
    };
  }
  return {
    bg: "bg-neutral-800/50",
    text: "text-neutral-400",
    border: "border-neutral-700/50",
    icon: Clock
  };
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

// Webhook Delivery görüntüleme modalı
function WebhookDeliveryViewModal({ 
  delivery, 
  endpoint,
  isOpen, 
  onClose 
}: { 
  delivery: WebhookDeliveryDto | null;
  endpoint?: WebhookEndpointDto;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !delivery) return null;

  const responseStyles = getResponseStatusStyles(delivery.responseStatus);
  const ResponseIcon = responseStyles.icon;

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
              responseStyles.bg
            )}>
              <ResponseIcon className={cn("w-6 h-6", responseStyles.text)} />
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", text.primary)}>Webhook Teslimat Detayları</h2>
              <p className={cn("text-sm", text.muted)}>Event: {delivery.eventType}</p>
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
          {/* Response Status */}
          <div className="flex items-center gap-2">
            <span className={cn("text-sm font-medium", text.secondary)}>Response Status:</span>
            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              responseStyles.bg,
              responseStyles.text,
              responseStyles.border,
              "border"
            )}>
              {delivery.responseStatus} - {getResponseStatusLabel(delivery.responseStatus)}
            </span>
            {delivery.retries > 0 && (
              <span className={cn("text-xs", text.muted)}>
                ({delivery.retries} yeniden deneme)
              </span>
            )}
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Endpoint URL</div>
              <div className={cn("text-xs font-mono truncate", text.primary)}>
                {endpoint?.url || delivery.webhookEndpointId.substring(0, 8)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Event Type</div>
              <div className={cn("text-sm", text.primary)}>
                {delivery.eventType}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Deneme Zamanı</div>
              <div className={cn("text-xs", text.primary)}>
                {formatDateTime(delivery.attemptedAt)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşturulma</div>
              <div className={cn("text-xs", text.primary)}>
                {formatDateTime(delivery.createdDate)}
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
              {JSON.stringify(JSON.parse(delivery.payload), null, 2)}
            </pre>
          </div>

          {/* Response Body */}
          {delivery.responseBody && (
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Response Body</div>
              <pre className={cn(
                "text-xs p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto max-h-40",
                text.primary
              )}>
                {delivery.responseBody.length > 500 
                  ? delivery.responseBody.substring(0, 500) + "..."
                  : delivery.responseBody}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WebhookDeliveriesListClient({ 
  deliveries, 
  endpoints,
  searchQuery,
  webhookEndpointId,
  eventType,
  pagination
}: { 
  deliveries: WebhookDeliveryDto[];
  endpoints: WebhookEndpointDto[];
  searchQuery: string;
  webhookEndpointId?: string;
  eventType?: string;
  pagination?: PaginationInfo;
}) {
  const [expandedDeliveries, setExpandedDeliveries] = useState<Set<string>>(new Set());
  const [viewingDelivery, setViewingDelivery] = useState<WebhookDeliveryDto | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedDeliveries(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (deliveries.length === 0) {
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
            <Send className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || webhookEndpointId || eventType
              ? "Arama kriterlerinize uygun teslimat bulunamadı"
              : "Henüz webhook teslimatı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {deliveries.map((delivery) => {
          const endpoint = endpoints.find(e => e.id === delivery.webhookEndpointId);
          const isExpanded = expandedDeliveries.has(delivery.id);
          const responseStyles = getResponseStatusStyles(delivery.responseStatus);
          const ResponseIcon = responseStyles.icon;

          return (
            <article
              key={delivery.id}
              className={cn(
                components.card,
                "p-5 sm:p-6",
                "flex flex-col gap-4"
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                      responseStyles.bg
                    )}>
                      <ResponseIcon className={cn("w-5 h-5", responseStyles.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("text-base font-semibold", text.primary)}>
                          {delivery.eventType}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          responseStyles.bg,
                          responseStyles.text,
                          responseStyles.border,
                          "border"
                        )}>
                          {delivery.responseStatus} - {getResponseStatusLabel(delivery.responseStatus)}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 truncate">
                        {endpoint?.url || delivery.webhookEndpointId.substring(0, 8)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingDelivery(delivery)}
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
                    onClick={() => toggleExpand(delivery.id)}
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
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Deneme Zamanı</div>
                      <div className={cn("text-xs", text.primary)}>
                        {formatDateTime(delivery.attemptedAt)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Yeniden Deneme</div>
                      <div className={cn("text-xs", text.primary)}>
                        {delivery.retries}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Response Status</div>
                      <div className={cn("text-xs font-semibold", responseStyles.text)}>
                        {delivery.responseStatus}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşturulma</div>
                      <div className={cn("text-xs", text.primary)}>
                        {formatDateTime(delivery.createdDate)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className={cn("text-xs font-medium mb-1", text.muted)}>Payload (Önizleme)</div>
                    <pre className={cn(
                      "text-xs p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto max-h-32",
                      text.primary
                    )}>
                      {JSON.stringify(JSON.parse(delivery.payload), null, 2).substring(0, 300)}...
                    </pre>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* View Modal */}
      <WebhookDeliveryViewModal
        delivery={viewingDelivery}
        endpoint={viewingDelivery ? endpoints.find(e => e.id === viewingDelivery.webhookEndpointId) : undefined}
        isOpen={viewingDelivery !== null}
        onClose={() => setViewingDelivery(null)}
      />
    </>
  );
}

