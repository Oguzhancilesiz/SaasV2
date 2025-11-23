"use client";

import { useState, useTransition } from "react";
import type { ApiKeyDto } from "@/types/apikey";
import type { AppDto } from "@/types/app";
import { Key, Trash2, Copy, Eye, EyeOff, Edit } from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { deleteApiKeyAction, revokeApiKeyAction } from "./actions";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import type { PaginationInfo } from "@/lib/filterUtils";
import { Building2, Calendar, Clock, Shield } from "lucide-react";

export default function ApiKeysListClient({ 
  apiKeys, 
  apps, 
  searchQuery,
  appId,
  pagination
}: { 
  apiKeys: ApiKeyDto[];
  apps: AppDto[];
  searchQuery: string;
  appId?: string;
  pagination?: PaginationInfo;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState<{ id: string; name: string } | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  const df = new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" });

  const handleDelete = (id: string) => {
    setPendingId(id);
    startTransition(() => deleteApiKeyAction(id));
  };

  const handleRevoke = (id: string) => {
    setPendingId(id);
    startTransition(() => revokeApiKeyAction(id));
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
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
  };

  if (apiKeys.length === 0) {
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
            <Key className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId
              ? "Arama kriterlerinize uygun anahtar bulunamadı"
              : "Henüz API anahtarı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apiKeys.map((key) => {
          const app = apps.find(a => a.id === key.appId);
          const isPending = pendingId === key.id;
          const isActive = key.status === 1;
          const isExpired = key.expiresAt && new Date(key.expiresAt) < new Date();
          const isVisible = visibleKeys.has(key.id);
          const fullKey = `${key.prefix}_${key.hash}`;
          const displayKey = isVisible ? fullKey : `${key.prefix}_${'•'.repeat(Math.min(key.hash.length, 32))}`;

          return (
            <article
              key={key.id}
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
                      isActive && !isExpired
                        ? "bg-emerald-500/10 text-emerald-400"
                        : isExpired
                        ? "bg-red-500/10 text-red-400"
                        : "bg-neutral-800/50 text-neutral-400"
                    )}>
                      <Key className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-lg font-bold truncate", text.primary)}>
                        {key.name}
                      </h3>
                      {app && (
                        <div className="flex items-center gap-1 text-xs text-neutral-400 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span className="truncate">{app.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* API Key Display */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn(
                      "font-mono text-xs px-3 py-1.5 rounded-lg",
                      "bg-neutral-800/50 border border-neutral-700/50",
                      "flex-1 truncate",
                      text.tertiary
                    )}>
                      {displayKey}
                    </span>
                    <button
                      onClick={() => toggleKeyVisibility(key.id)}
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
                      onClick={() => copyToClipboard(fullKey)}
                      className={cn(
                        "p-1.5 rounded-lg",
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

                  {/* Scopes */}
                  {key.scopes && (
                    <div className="flex items-start gap-2 text-xs mb-2">
                      <Shield className="w-3.5 h-3.5 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <div className={cn("flex-1", text.muted)}>
                        <span className="font-medium">Scopes: </span>
                        <span className={text.secondary}>{key.scopes}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Status Badge */}
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border flex-shrink-0",
                    isActive && !isExpired
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : isExpired
                      ? "bg-red-500/10 text-red-400 border-red-500/20"
                      : "bg-neutral-800/50 text-neutral-400 border-neutral-700/50"
                  )}
                >
                  <span className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    isActive && !isExpired ? "bg-emerald-400" : isExpired ? "bg-red-400" : "bg-neutral-500"
                  )} />
                  {isActive && !isExpired ? "Aktif" : isExpired ? "Süresi Dolmuş" : "Pasif"}
                </span>
              </div>

              {/* Dates */}
              <div className="space-y-1.5 text-xs">
                {key.createdDate && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span suppressHydrationWarning>
                      Oluşturulma: {df.format(new Date(key.createdDate))}
                    </span>
                  </div>
                )}
                {key.expiresAt && (
                  <div className={cn(
                    "flex items-center gap-2",
                    isExpired ? "text-red-400" : "text-neutral-500"
                  )}>
                    <Calendar className="w-3.5 h-3.5" />
                    <span suppressHydrationWarning>
                      Bitiş: {df.format(new Date(key.expiresAt))}
                    </span>
                  </div>
                )}
                {key.lastUsedAt && (
                  <div className="flex items-center gap-2 text-neutral-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span suppressHydrationWarning>
                      Son Kullanım: {df.format(new Date(key.lastUsedAt))}
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/50">
                <a
                  href={`/apikeys/${key.id}`}
                  className={cn(
                    "px-3 py-2 rounded-lg",
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                    "hover:bg-blue-500/20 transition-all",
                    "flex items-center gap-1.5 text-xs font-medium"
                  )}
                  title="Düzenle"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Düzenle
                </a>
                
                {isActive && !isExpired && (
                  <button
                    onClick={() => setShowRevokeDialog({ id: key.id, name: key.name })}
                    disabled={isPending}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-medium",
                      "bg-orange-500/10 text-orange-400 border border-orange-500/20",
                      "hover:bg-orange-500/20 transition-all",
                      isPending && "opacity-50 cursor-not-allowed"
                    )}
                    title="İptal Et"
                  >
                    İptal Et
                  </button>
                )}

                <button
                  onClick={() => setShowDeleteDialog({ id: key.id, name: key.name })}
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
          title="API Anahtarını Sil"
          message={`"${showDeleteDialog.name}" anahtarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
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

      {showRevokeDialog && (
        <ConfirmDialog
          isOpen={true}
          title="API Anahtarını İptal Et"
          message={`"${showRevokeDialog.name}" anahtarını iptal etmek istediğinize emin misiniz?`}
          confirmText="Evet, İptal Et"
          cancelText="İptal"
          variant="warning"
          onConfirm={() => {
            handleRevoke(showRevokeDialog.id);
            setShowRevokeDialog(null);
          }}
          onCancel={() => setShowRevokeDialog(null)}
        />
      )}
    </>
  );
}

