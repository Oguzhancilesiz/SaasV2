"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { AppUserRegistrationDto } from "@/lib/appUserRegistrationsService";
import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { Status } from "@/types/app";
import { 
  UserPlus, Edit, Trash2, Package, User, Calendar, 
  Globe, Hash
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { deleteAppUserRegistration } from "@/lib/appUserRegistrationsService";
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
    minute: "2-digit"
  });
}

export default function AppUserRegistrationsListClient({ 
  registrations, 
  apps, 
  users,
  searchQuery,
  appId,
  userId,
  pagination
}: { 
  registrations: AppUserRegistrationDto[];
  apps: AppDto[];
  users: UserDto[];
  searchQuery: string;
  appId?: string;
  userId?: string;
  pagination?: PaginationInfo;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState<{ id: string } | null>(null);
  const [, startTransition] = useTransition();
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const handleDelete = async (id: string) => {
    setPendingId(id);
    startTransition(async () => {
      try {
        await deleteAppUserRegistration(id);
        notifySuccess("Başarılı", "Kullanıcı kaydı silindi");
        window.location.reload();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Kullanıcı kaydı silinemedi");
      } finally {
        setPendingId(null);
      }
    });
  };

  if (registrations.length === 0) {
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
            <UserPlus className="w-8 h-8 text-neutral-500" />
          </div>
          <h3 className={cn("text-lg font-semibold mb-2", text.primary)}>
            {searchQuery || appId || userId
              ? "Arama kriterlerinize uygun kayıt bulunamadı"
              : "Henüz kullanıcı kaydı yok"}
          </h3>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {registrations.map((registration) => {
          const app = apps.find(a => a.id === registration.appId);
          const user = users.find(u => u.userId === registration.userId);
          const isPending = pendingId === registration.id;
          const statusStyles = getStatusStyles(registration.status);

          return (
            <article
              key={registration.id}
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
                      "bg-blue-500/10 text-blue-400"
                    )}>
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles.bg,
                          statusStyles.text,
                          statusStyles.border,
                          "border"
                        )}>
                          {getStatusLabel(registration.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* App & User */}
                  <div className="space-y-2 text-sm">
                    {app && (
                      <div className="flex items-center gap-2 text-neutral-300">
                        <Package className="w-4 h-4 text-neutral-500" />
                        <span className="truncate">{app.name} ({app.code})</span>
                      </div>
                    )}
                    {user && (
                      <div className="flex items-center gap-2 text-neutral-300">
                        <User className="w-4 h-4 text-neutral-500" />
                        <span className="truncate">{user.email || user.userName || user.userId}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Kayıt: {formatDateTime(registration.registeredAt)}</span>
                </div>
                {registration.provider && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Provider: {registration.provider}</span>
                  </div>
                )}
                {registration.externalId && (
                  <div className="flex items-center gap-2">
                    <Hash className="w-3.5 h-3.5" />
                    <span className="font-mono truncate">External ID: {registration.externalId}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-neutral-800/50">
                <Link
                  href={`/app-user-registrations/${registration.id}`}
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
                
                <button
                  onClick={() => setShowDeleteDialog({ id: registration.id })}
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
          title="Kullanıcı Kaydını Sil"
          message="Bu kullanıcı kaydını silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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

