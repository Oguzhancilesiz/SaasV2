"use client";

import { useState } from "react";
import type { UsageRecordDto } from "@/lib/usageRecordsService";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import type { FeatureDto } from "@/types/feature";
import { Status } from "@/types/app";
import { 
  Activity, Eye, ChevronDown, ChevronUp, 
  Package, User, Zap, Calendar, Hash, FileText
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

// Usage Record görüntüleme modalı
function UsageRecordViewModal({ 
  record, 
  app, 
  user, 
  feature,
  isOpen, 
  onClose 
}: { 
  record: UsageRecordDto | null;
  app?: AppDto;
  user?: UserDto;
  feature?: FeatureDto;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen || !record) return null;

  const statusStyles = getStatusStyles(record.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={cn(
        "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
        "w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      )}>
        {/* Header */}
        <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              "bg-blue-500/10 text-blue-400"
            )}>
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h2 className={cn("text-xl font-bold", text.primary)}>Kullanım Kaydı Detayları</h2>
              <p className={cn("text-sm", text.muted)}>ID: {record.id.substring(0, 8)}...</p>
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
              {getStatusLabel(record.status)}
            </span>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Uygulama</div>
              <div className={cn("text-sm", text.primary)}>
                {app ? `${app.name} (${app.code})` : record.appId.substring(0, 8)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Kullanıcı</div>
              <div className={cn("text-sm", text.primary)}>
                {user ? (user.email || user.userName || user.userId) : record.userId.substring(0, 8)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Özellik</div>
              <div className={cn("text-sm", text.primary)}>
                {feature ? `${feature.name} (${feature.key})` : record.featureId.substring(0, 8)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Miktar</div>
              <div className={cn("text-sm font-semibold", text.primary)}>
                {record.quantity}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşma Zamanı</div>
              <div className={cn("text-sm", text.primary)}>
                {formatDateTime(record.occurredAt)}
              </div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Kayıt Tarihi</div>
              <div className={cn("text-sm", text.primary)}>
                {formatDateTime(record.createdDate)}
              </div>
            </div>
          </div>

          {/* Correlation ID */}
          <div>
            <div className={cn("text-xs font-medium mb-1", text.muted)}>Correlation ID</div>
            <div className={cn(
              "text-xs font-mono px-3 py-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50",
              text.primary
            )}>
              {record.correlationId}
            </div>
          </div>

          {/* Metadata */}
          {record.metadataJson && (
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Metadata</div>
              <pre className={cn(
                "text-xs p-3 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto",
                text.primary
              )}>
                {JSON.stringify(JSON.parse(record.metadataJson), null, 2)}
              </pre>
            </div>
          )}

          {/* Subscription */}
          {record.subscriptionId && (
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Abonelik ID</div>
              <div className={cn("text-xs font-mono", text.primary)}>
                {record.subscriptionId}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsageRecordsListClient({ 
  usageRecords, 
  apps, 
  users,
  features,
  searchQuery,
  appId,
  userId,
  featureId,
  pagination
}: { 
  usageRecords: UsageRecordDto[];
  apps: AppDto[];
  users: UserDto[];
  features: FeatureDto[];
  searchQuery: string;
  appId?: string;
  userId?: string;
  featureId?: string;
  pagination?: PaginationInfo;
}) {
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [viewingRecord, setViewingRecord] = useState<UsageRecordDto | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRecords(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (usageRecords.length === 0) {
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
            <Activity className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId || userId || featureId
              ? "Arama kriterlerinize uygun kayıt bulunamadı"
              : "Henüz kullanım kaydı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {usageRecords.map((record) => {
          const app = apps.find(a => a.id === record.appId);
          const user = users.find(u => u.userId === record.userId);
          const feature = features.find(f => f.id === record.featureId);
          const isExpanded = expandedRecords.has(record.id);
          const statusStyles = getStatusStyles(record.status);

          return (
            <article
              key={record.id}
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
                      "bg-blue-500/10 text-blue-400"
                    )}>
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={cn("text-base font-semibold", text.primary)}>
                          {feature?.name || "Bilinmeyen Özellik"}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles.bg,
                          statusStyles.text,
                          statusStyles.border,
                          "border"
                        )}>
                          {getStatusLabel(record.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        {app && (
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            <span className="truncate">{app.name}</span>
                          </div>
                        )}
                        {user && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            <span className="truncate">{user.email || user.userName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setViewingRecord(record)}
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
                    onClick={() => toggleExpand(record.id)}
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
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Miktar</div>
                      <div className={cn("text-sm font-semibold", text.primary)}>
                        {record.quantity}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Oluşma Zamanı</div>
                      <div className={cn("text-xs", text.primary)}>
                        {formatDateTime(record.occurredAt)}
                      </div>
                    </div>
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Correlation ID</div>
                      <div className={cn("text-xs font-mono truncate", text.primary)}>
                        {record.correlationId}
                      </div>
                    </div>
                    {record.subscriptionId && (
                      <div>
                        <div className={cn("text-xs font-medium mb-1", text.muted)}>Abonelik</div>
                        <div className={cn("text-xs font-mono truncate", text.primary)}>
                          {record.subscriptionId.substring(0, 8)}...
                        </div>
                      </div>
                    )}
                  </div>
                  {record.metadataJson && (
                    <div>
                      <div className={cn("text-xs font-medium mb-1", text.muted)}>Metadata</div>
                      <pre className={cn(
                        "text-xs p-2 rounded-lg bg-neutral-800/50 border border-neutral-700/50 overflow-x-auto",
                        text.primary
                      )}>
                        {JSON.stringify(JSON.parse(record.metadataJson), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>

      {/* View Modal */}
      <UsageRecordViewModal
        record={viewingRecord}
        app={viewingRecord ? apps.find(a => a.id === viewingRecord.appId) : undefined}
        user={viewingRecord ? users.find(u => u.userId === viewingRecord.userId) : undefined}
        feature={viewingRecord ? features.find(f => f.id === viewingRecord.featureId) : undefined}
        isOpen={viewingRecord !== null}
        onClose={() => setViewingRecord(null)}
      />
    </>
  );
}

