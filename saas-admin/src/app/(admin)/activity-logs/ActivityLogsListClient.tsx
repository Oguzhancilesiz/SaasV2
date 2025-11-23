"use client";

import { useState, useEffect } from "react";
import type { ActivityLogDto } from "@/types/activityLog";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { 
  Activity, User, AppWindow, Calendar, Clock,
  Eye, ChevronDown, ChevronUp, 
  FileText, ShoppingCart, Package, DollarSign,
  Key, Webhook, Users, Settings
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import Link from "next/link";

const entityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Subscription: ShoppingCart,
  Invoice: FileText,
  Plan: Package,
  App: AppWindow,
  User: Users,
  ApiKey: Key,
  WebhookEndpoint: Webhook,
  Feature: Settings,
};

function getEntityIcon(entityType: string) {
  return entityIcons[entityType] || Activity;
}

function formatDateTime(dateString: string | null) {
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

function getRelativeTime(dateString: string | null, currentTime: Date = new Date()): string {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const diffMs = currentTime.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return `${diffSeconds} saniye önce`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} dakika önce`;
  } else if (diffHours < 24) {
    return `${diffHours} saat önce`;
  } else if (diffDays < 30) {
    return `${diffDays} gün önce`;
  } else {
    return formatDateTime(dateString);
  }
}

function getEntityName(log: ActivityLogDto, apps: AppDto[], users: UserDto[]): string {
  // Önce newValues'dan name/code bilgisini çıkar
  if (log.newValues) {
    try {
      const newVals = JSON.parse(log.newValues);
      // Name alanları
      if (newVals.Name) return newVals.Name;
      if (newVals.name) return newVals.name;
      // Code alanları
      if (newVals.Code) return newVals.Code;
      if (newVals.code) return newVals.code;
      // Email/UserName (User entity için)
      if (newVals.Email) return newVals.Email;
      if (newVals.email) return newVals.email;
      if (newVals.UserName) return newVals.UserName;
      if (newVals.userName) return newVals.userName;
      // Description (eğer name yoksa)
      if (newVals.Description) return newVals.Description;
      if (newVals.description) return newVals.description;
    } catch {}
  }

  // Eğer newValues'da yoksa oldValues'dan dene
  if (log.oldValues) {
    try {
      const oldVals = JSON.parse(log.oldValues);
      if (oldVals.Name) return oldVals.Name;
      if (oldVals.name) return oldVals.name;
      if (oldVals.Code) return oldVals.Code;
      if (oldVals.code) return oldVals.code;
      if (oldVals.Email) return oldVals.Email;
      if (oldVals.email) return oldVals.email;
      if (oldVals.UserName) return oldVals.UserName;
      if (oldVals.userName) return oldVals.userName;
      if (oldVals.Description) return oldVals.Description;
      if (oldVals.description) return oldVals.description;
    } catch {}
  }

  // Entity type'a göre ilgili entity'yi bul
  if (log.entityType === "App" && log.appId) {
    const app = apps.find(a => a.id === log.appId);
    if (app) return `${app.name} (${app.code})`;
  }

  if (log.entityType === "User" && log.userId) {
    const user = users.find(u => u.userId === log.userId);
    if (user) return `${user.userName || user.email}`;
  }

  // Hiçbir şey bulunamazsa entity type ve kısa ID göster
  if (log.entityId) {
    return `${log.entityType} (${log.entityId.substring(0, 8)}...)`;
  }
  return `${log.entityType}`;
}

function getActionColor(action: string) {
  switch (action) {
    case "Create":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Update":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Delete":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
  }
}

export default function ActivityLogsListClient({
  logs,
  apps,
  users,
}: {
  logs: ActivityLogDto[];
  apps: AppDto[];
  users: UserDto[];
}) {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Her saniye güncelle (relative time için)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  if (logs.length === 0) {
    return (
      <div className={cn(components.card, "p-12 text-center")}>
        <Activity className="w-12 h-12 mx-auto mb-4 text-neutral-500" />
        <p className={cn("text-lg font-medium mb-2", text.primary)}>Aktivite logu bulunamadı</p>
        <p className={cn("text-sm", text.secondary)}>
          Henüz sistemde herhangi bir işlem kaydedilmemiş.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => {
        const isExpanded = expandedLogs.has(log.id);
        const EntityIcon = getEntityIcon(log.entityType);
        const app = apps.find(a => a.id === log.appId);
        const user = users.find(u => u.userId === log.userId);

        return (
          <div
            key={log.id}
            className={cn(
              components.card,
              "p-5 transition-all hover:border-neutral-600"
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Kullanıcı Bilgisi - Üstte Belirgin */}
                <div className={cn("mb-3 pb-3 border-b", border.default)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className={cn("w-4 h-4", text.secondary)} />
                      <div>
                        {log.userName ? (
                          <>
                            <span className={cn("text-sm font-semibold", text.primary)}>
                              {log.userName}
                            </span>
                            {log.userEmail && (
                              <span className={cn("text-xs ml-2", text.muted)}>
                                ({log.userEmail})
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={cn("text-sm", text.muted)}>
                            Sistem
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-neutral-400">
                      <Clock className="w-3 h-3" />
                      <span>{getRelativeTime(log.createdDate, currentTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("p-2 rounded-lg", getActionColor(log.action))}>
                    <EntityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={cn("text-sm font-semibold", text.primary)}>
                        {log.action} {log.entityType}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded", getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </div>
                    <div className={cn("text-sm mb-2", text.secondary)}>
                      <span className="font-medium">Nesne: </span>
                      <span>{getEntityName(log, apps, users)}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-400">
                      {log.appName && (
                        <span className="flex items-center gap-1">
                          <AppWindow className="w-3 h-3" />
                          {log.appName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateTime(log.createdDate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Değişiklik Detayları - Her zaman görünür (eğer varsa) */}
                {(log.oldValues || log.newValues) && (
                  <div className={cn("mt-3 pt-3 border-t", border.default)}>
                    <div className={cn("text-xs font-semibold mb-2", text.primary)}>
                      {log.action === "Update" ? "Değişiklik Detayları:" : log.action === "Create" ? "Oluşturulan Değerler:" : "Silinen Değerler:"}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {log.oldValues && (
                        <div>
                          <span className={cn("text-xs font-medium mb-1 block", text.muted)}>
                            Eski Değerler:
                          </span>
                          <pre className={cn("p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs overflow-x-auto max-h-48", text.secondary)}>
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(log.oldValues), null, 2);
                              } catch {
                                return log.oldValues;
                              }
                            })()}
                          </pre>
                        </div>
                      )}
                      {log.newValues && (
                        <div>
                          <span className={cn("text-xs font-medium mb-1 block", text.muted)}>
                            {log.action === "Update" ? "Yeni Değerler:" : "Değerler:"}
                          </span>
                          <pre className={cn("p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs overflow-x-auto max-h-48", text.secondary)}>
                            {(() => {
                              try {
                                return JSON.stringify(JSON.parse(log.newValues), null, 2);
                              } catch {
                                return log.newValues;
                              }
                            })()}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {isExpanded && (
                  <div className={cn("mt-4 pt-4 border-t", border.default)}>
                    <div className={cn("text-xs font-semibold mb-3", text.primary)}>
                      Teknik Detaylar:
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {log.entityId && (
                        <div>
                          <span className={cn("text-xs font-medium", text.muted)}>Entity ID:</span>
                          <div className={cn("font-mono text-xs mt-1", text.secondary)}>{log.entityId}</div>
                        </div>
                      )}
                      {log.requestId && (
                        <div>
                          <span className={cn("text-xs font-medium", text.muted)}>Request ID:</span>
                          <div className={cn("font-mono text-xs mt-1", text.secondary)}>{log.requestId}</div>
                        </div>
                      )}
                      {log.ipAddress && (
                        <div>
                          <span className={cn("text-xs font-medium", text.muted)}>IP Address:</span>
                          <div className={cn("font-mono text-xs mt-1", text.secondary)}>{log.ipAddress}</div>
                        </div>
                      )}
                      {log.userAgent && (
                        <div className="md:col-span-2">
                          <span className={cn("text-xs font-medium", text.muted)}>User Agent:</span>
                          <div className={cn("font-mono text-xs break-all mt-1", text.secondary)}>{log.userAgent}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => toggleExpand(log.id)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  "bg-neutral-800/50 hover:bg-neutral-800/70",
                  "border border-neutral-700/50"
                )}
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-neutral-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-neutral-400" />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

