"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { RoleDto } from "@/lib/rolesService";
import { Status } from "@/types/app";
import { 
  Shield, Edit, Trash2, RotateCcw
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { deleteRole, restoreRole } from "@/lib/rolesService";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import Pagination from "@/components/filters/Pagination";
import type { PaginationInfo } from "@/lib/filterUtils";

// Status değerini Türkçe label'a çeviren fonksiyon
function getStatusLabel(status: Status | number): string {
  const statusNum = typeof status === 'number' ? status : Number(status);
  
  switch (statusNum) {
    case Status.Active:
    case 1:
      return "Aktif";
    case Status.Deleted:
    case 4:
      return "Silindi";
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
    case Status.Deleted:
    case 4:
      return {
        bg: "bg-red-500/10",
        text: "text-red-400",
        border: "border-red-500/20",
        dot: "bg-red-400"
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
    minute: "2-digit"
  });
}

export default function RolesListClient({ 
  roles, 
  searchQuery,
  pagination
}: { 
  roles: RoleDto[];
  searchQuery: string;
  pagination?: PaginationInfo;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string; name: string } | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState<{ id: string; name: string } | null>(null);
  const [, startTransition] = useTransition();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const handleDelete = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteRole(id);
        notifySuccess("Başarılı", "Rol silindi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Rol silinemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  const handleRestore = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await restoreRole(id);
        notifySuccess("Başarılı", "Rol geri yüklendi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Rol geri yüklenemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  if (roles.length === 0) {
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
            <Shield className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery
              ? "Arama kriterlerinize uygun rol bulunamadı"
              : "Henüz rol yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isPending = pendingId === role.id;
          const isDeleted = role.status === Status.Deleted || role.status === 4;
          const statusStyles = getStatusStyles(role.status);

          return (
            <article
              key={role.id}
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
                      "bg-purple-500/10 text-purple-400"
                    )}>
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={cn("text-lg font-bold truncate", text.primary)}>
                        {role.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles.bg,
                          statusStyles.text,
                          statusStyles.border,
                          "border"
                        )}>
                          {getStatusLabel(role.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-neutral-400">
                    Oluşturulma: {formatDateTime(role.cratedDate)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/50">
                {!isDeleted && (
                  <Link
                    href={`/roles/${role.id}`}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-medium",
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                      "hover:bg-blue-500/20 transition-all",
                      "flex items-center justify-center gap-1.5"
                    )}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Düzenle
                  </Link>
                )}
                
                {isDeleted ? (
                  <button
                    onClick={() => setShowRestoreDialog({ id: role.id, name: role.name })}
                    disabled={isPending}
                    className={cn(
                      "flex-1 px-3 py-2 rounded-lg text-xs font-medium",
                      "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                      "hover:bg-emerald-500/20 transition-all",
                      "flex items-center justify-center gap-1.5",
                      isPending && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Geri Yükle
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDeleteDialog({ id: role.id, name: role.name })}
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
                )}
              </div>
            </article>
          );
        })}
      </div>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Rolü Sil"
          message={`"${showDeleteDialog.name}" rolünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
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

      {showRestoreDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Rolü Geri Yükle"
          message={`"${showRestoreDialog.name}" rolünü geri yüklemek istediğinize emin misiniz?`}
          confirmText="Evet, Geri Yükle"
          cancelText="İptal"
          variant="info"
          onConfirm={() => {
            handleRestore(showRestoreDialog.id);
            setShowRestoreDialog(null);
          }}
          onCancel={() => setShowRestoreDialog(null)}
        />
      )}
    </>
  );
}

