"use client";

import type { RoleDto } from "@/lib/rolesService";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, Shield, Trash2, Key, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { renameRole, deleteRole } from "@/lib/rolesService";
import { getRoleClaims, createRoleClaim, deleteRoleClaim, type RoleClaimDto, type RoleClaimAddDto } from "@/lib/roleClaimsService";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

export default function EditForm({ role: initialRole }: { role: RoleDto }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [roleClaims, setRoleClaims] = useState<RoleClaimDto[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(true);
  const [expandedClaims, setExpandedClaims] = useState(true);
  const [showAddClaimDialog, setShowAddClaimDialog] = useState(false);
  const [showDeleteClaimDialog, setShowDeleteClaimDialog] = useState<{ claimType: string; claimValue: string } | null>(null);
  const [newClaim, setNewClaim] = useState({ claimType: "", claimValue: "" });
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    name: initialRole.name,
  });

  useEffect(() => {
    loadRoleClaims();
  }, [initialRole.id]);

  const loadRoleClaims = async () => {
    setLoadingClaims(true);
    try {
      const claims = await getRoleClaims(initialRole.id);
      setRoleClaims(claims);
    } catch (error) {
      console.error("Error loading role claims:", error);
    } finally {
      setLoadingClaims(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.name.trim()) {
      setErr("Lütfen rol adını girin.");
      return;
    }

    if (formData.name.trim() === initialRole.name) {
      notifyError("Uyarı", "Rol adı değişmedi");
      return;
    }

    start(async () => {
      try {
        await renameRole(initialRole.id, formData.name.trim());
        
        notifySuccess("Başarılı", "Rol güncellendi");
        router.push("/roles");
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Rol güncellenemedi";
        setErr(errorMessage);
        notifyError("Güncelleme başarısız", errorMessage);
      }
    });
  };

  const handleDelete = async () => {
    start(async () => {
      try {
        await deleteRole(initialRole.id);
        notifySuccess("Başarılı", "Rol silindi");
        router.push("/roles");
        router.refresh();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Rol silinemedi");
      }
    });
  };

  const handleAddClaim = async () => {
    if (!newClaim.claimType || !newClaim.claimValue) {
      notifyError("Hata", "Claim Type ve Claim Value zorunludur");
      return;
    }

    start(async () => {
      try {
        await createRoleClaim({
          roleId: initialRole.id,
          claimType: newClaim.claimType.trim(),
          claimValue: newClaim.claimValue.trim(),
        });
        notifySuccess("Başarılı", "Claim eklendi");
        setShowAddClaimDialog(false);
        setNewClaim({ claimType: "", claimValue: "" });
        loadRoleClaims();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Claim eklenemedi");
      }
    });
  };

  const handleDeleteClaim = async () => {
    if (!showDeleteClaimDialog) return;

    start(async () => {
      try {
        await deleteRoleClaim(initialRole.id, showDeleteClaimDialog.claimType, showDeleteClaimDialog.claimValue);
        notifySuccess("Başarılı", "Claim silindi");
        setShowDeleteClaimDialog(null);
        loadRoleClaims();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Claim silinemedi");
      }
    });
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn(
          "max-w-2xl space-y-6",
          components.card,
          "p-6 sm:p-8"
        )}
      >
        {/* Rol Adı */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Shield className="w-4 h-4" />
            Rol Adı *
          </label>
          <InputBase
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Örn: Admin, User, Moderator"
          />
          <p className={cn("text-xs", text.muted)}>
            Rol adı benzersiz olmalıdır
          </p>
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

        {/* Role Claims Section */}
        <div className="border-t border-neutral-800/50 pt-6">
          <button
            onClick={() => setExpandedClaims(!expandedClaims)}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className={cn("text-lg font-semibold", text.primary)}>
                Role Claims ({roleClaims.length})
              </h3>
            </div>
            {expandedClaims ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {expandedClaims && (
            <div className="space-y-4">
              {loadingClaims ? (
                <div className={cn("text-sm text-center py-4", text.muted)}>Yükleniyor...</div>
              ) : (
                <>
                  {roleClaims.length > 0 ? (
                    <div className="space-y-2">
                      {roleClaims.map((claim, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            "bg-neutral-800/50 border border-neutral-700/50"
                          )}
                        >
                          <div className="flex-1">
                            <div className={cn("text-sm font-medium", text.primary)}>
                              {claim.claimType}
                            </div>
                            <div className={cn("text-xs", text.muted)}>
                              {claim.claimValue}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteClaimDialog({ claimType: claim.claimType, claimValue: claim.claimValue })}
                            className={cn(
                              "p-2 rounded-lg",
                              "bg-red-500/10 text-red-400 border border-red-500/20",
                              "hover:bg-red-500/20 transition-all"
                            )}
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={cn("text-sm text-center py-4", text.muted)}>
                      Rolün claim'i yok
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddClaimDialog(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                      "hover:bg-blue-500/20 transition-all",
                      "flex items-center gap-2"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Claim Ekle
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-neutral-800/50">
          <button
            type="submit"
            className={cn(components.buttonPrimary, "flex-1 min-w-[140px] disabled:opacity-50")}
            disabled={pending}
          >
            <Save className="w-4 h-4" />
            {pending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteDialog(true)}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-red-500/10 text-red-400 border border-red-500/20",
              "hover:bg-red-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
          >
            <Trash2 className="w-4 h-4" />
            Sil
          </button>

          <a
            href="/roles"
            className={components.buttonSecondary}
          >
            <X className="w-4 h-4" />
            İptal
          </a>
        </div>
      </form>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Rolü Sil"
          message={`"${initialRole.name}" rolünü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={() => {
            handleDelete();
            setShowDeleteDialog(false);
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}

      {/* Add Claim Dialog */}
      {showAddClaimDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
            "w-full max-w-md p-6 space-y-4"
          )}>
            <h3 className={cn("text-lg font-bold", text.primary)}>Yeni Claim Ekle</h3>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Claim Type *
              </label>
              <InputBase
                type="text"
                value={newClaim.claimType}
                onChange={(e) => setNewClaim({ ...newClaim, claimType: e.target.value })}
                placeholder="Örn: Permission, CustomClaim"
                required
              />
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Claim Value *
              </label>
              <InputBase
                type="text"
                value={newClaim.claimValue}
                onChange={(e) => setNewClaim({ ...newClaim, claimValue: e.target.value })}
                placeholder="Örn: CanEdit, CanDelete"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddClaim}
                disabled={pending}
                className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
              >
                <Save className="w-4 h-4" />
                {pending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => {
                  setShowAddClaimDialog(false);
                  setNewClaim({ claimType: "", claimValue: "" });
                }}
                className={components.buttonSecondary}
              >
                <X className="w-4 h-4" />
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Claim Dialog */}
      {showDeleteClaimDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Claim'i Sil"
          message={`"${showDeleteClaimDialog.claimType}: ${showDeleteClaimDialog.claimValue}" claim'ini silmek istediğinize emin misiniz?`}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={handleDeleteClaim}
          onCancel={() => setShowDeleteClaimDialog(null)}
        />
      )}
    </>
  );
}

