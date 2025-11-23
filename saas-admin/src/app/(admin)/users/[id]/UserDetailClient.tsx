"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import type { UserDto } from "@/types/user";
import type { RoleDto } from "@/lib/rolesService";
import { Status } from "@/types/app";
import { 
  User, Mail, Phone, Shield, Key, Globe, 
  Plus, Trash2, X, Save, ChevronDown, ChevronUp
} from "lucide-react";
import { components, bg, border, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { getUserRoles, addUserRoles } from "@/lib/usersService";
import { getUserClaims, createUserClaim, deleteUserClaim, type UserClaimDto, type UserClaimAddDto } from "@/lib/userClaimsService";
import { getUserLogins, deleteUserLogin, type UserLoginDto } from "@/lib/userLoginsService";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";

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
    case Status.UnApproved:
    case 3:
      return "Onay Bekliyor";
    case Status.Approved:
    case 6:
      return "Onaylandı";
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
    case Status.Approved:
    case 6:
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
        dot: "bg-blue-400"
      };
    case Status.DeActive:
    case 2:
      return {
        bg: "bg-orange-500/10",
        text: "text-orange-400",
        border: "border-orange-500/20",
        dot: "bg-orange-400"
      };
    case Status.UnApproved:
    case 3:
      return {
        bg: "bg-yellow-500/10",
        text: "text-yellow-400",
        border: "border-yellow-500/20",
        dot: "bg-yellow-400"
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

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(components.input, props.className)} />
  );
}

export default function UserDetailClient({ user, roles }: { user: UserDto; roles: RoleDto[] }) {
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userClaims, setUserClaims] = useState<UserClaimDto[]>([]);
  const [userLogins, setUserLogins] = useState<UserLoginDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, start] = useTransition();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["roles", "claims", "logins"]));
  const [showDeleteClaimDialog, setShowDeleteClaimDialog] = useState<{ claimType: string; claimValue: string } | null>(null);
  const [showDeleteLoginDialog, setShowDeleteLoginDialog] = useState<{ loginProvider: string; providerKey: string } | null>(null);
  const [showAddClaimDialog, setShowAddClaimDialog] = useState(false);
  const [showAddRoleDialog, setShowAddRoleDialog] = useState(false);
  const [newClaim, setNewClaim] = useState({ claimType: "", claimValue: "" });
  const [selectedRole, setSelectedRole] = useState("");
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const statusStyles = getStatusStyles(user.status);

  useEffect(() => {
    loadData();
  }, [user.userId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rolesData, claimsData, loginsData] = await Promise.all([
        getUserRoles(user.userId).catch(() => []),
        getUserClaims(user.userId).catch(() => []),
        getUserLogins(user.userId).catch(() => []),
      ]);
      setUserRoles(rolesData);
      setUserClaims(claimsData);
      setUserLogins(loginsData);
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const handleAddClaim = async () => {
    if (!newClaim.claimType || !newClaim.claimValue) {
      notifyError("Hata", "Claim Type ve Claim Value zorunludur");
      return;
    }

    start(async () => {
      try {
        await createUserClaim({
          userId: user.userId,
          claimType: newClaim.claimType.trim(),
          claimValue: newClaim.claimValue.trim(),
        });
        notifySuccess("Başarılı", "Claim eklendi");
        setShowAddClaimDialog(false);
        setNewClaim({ claimType: "", claimValue: "" });
        loadData();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Claim eklenemedi");
      }
    });
  };

  const handleDeleteClaim = async () => {
    if (!showDeleteClaimDialog) return;

    start(async () => {
      try {
        await deleteUserClaim(user.userId, showDeleteClaimDialog.claimType, showDeleteClaimDialog.claimValue);
        notifySuccess("Başarılı", "Claim silindi");
        setShowDeleteClaimDialog(null);
        loadData();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Claim silinemedi");
      }
    });
  };

  const handleAddRole = async () => {
    if (!selectedRole) {
      notifyError("Hata", "Lütfen bir rol seçin");
      return;
    }

    if (userRoles.includes(selectedRole)) {
      notifyError("Hata", "Kullanıcı zaten bu role sahip");
      return;
    }

    start(async () => {
      try {
        await addUserRoles(user.userId, [...userRoles, selectedRole]);
        notifySuccess("Başarılı", "Rol eklendi");
        setShowAddRoleDialog(false);
        setSelectedRole("");
        loadData();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Rol eklenemedi");
      }
    });
  };

  const handleDeleteLogin = async () => {
    if (!showDeleteLoginDialog) return;

    start(async () => {
      try {
        await deleteUserLogin(user.userId, showDeleteLoginDialog.loginProvider, showDeleteLoginDialog.providerKey);
        notifySuccess("Başarılı", "Login silindi");
        setShowDeleteLoginDialog(null);
        loadData();
      } catch (error: any) {
        notifyError("Hata", error?.message || "Login silinemedi");
      }
    });
  };

  return (
    <>
      <div className={cn(components.card, "p-6 sm:p-8 space-y-6")}>
        {/* User Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center",
              "bg-gradient-to-br from-blue-500/20 to-purple-500/20",
              "border border-blue-500/30"
            )}>
              <User className="w-8 h-8 text-blue-400" />
            </div>
            <div className="flex-1">
              <h2 className={cn("text-2xl font-bold mb-1", text.primary)}>
                {user.userName || user.email}
              </h2>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-xs font-medium",
                  statusStyles.bg,
                  statusStyles.text,
                  statusStyles.border,
                  "border"
                )}>
                  {getStatusLabel(user.status)}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Email</div>
              <div className={cn("text-sm", text.primary)}>{user.email || "-"}</div>
            </div>
            <div>
              <div className={cn("text-xs font-medium mb-1", text.muted)}>Telefon</div>
              <div className={cn("text-sm", text.primary)}>{user.phone || "-"}</div>
            </div>
          </div>
        </div>

        {/* User Roles Section */}
        <div className="border-t border-neutral-800/50 pt-6">
          <button
            onClick={() => toggleSection("roles")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h3 className={cn("text-lg font-semibold", text.primary)}>
                Roller ({userRoles.length})
              </h3>
            </div>
            {expandedSections.has("roles") ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {expandedSections.has("roles") && (
            <div className="space-y-4">
              {loading ? (
                <div className={cn("text-sm text-center py-4", text.muted)}>Yükleniyor...</div>
              ) : (
                <>
                  {userRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {userRoles.map((roleName) => (
                        <span
                          key={roleName}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-sm font-medium",
                            "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                          )}
                        >
                          {roleName}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={cn("text-sm text-center py-4", text.muted)}>
                      Kullanıcının rolü yok
                    </div>
                  )}

                  <button
                    onClick={() => setShowAddRoleDialog(true)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium",
                      "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                      "hover:bg-blue-500/20 transition-all",
                      "flex items-center gap-2"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Rol Ekle
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* User Claims Section */}
        <div className="border-t border-neutral-800/50 pt-6">
          <button
            onClick={() => toggleSection("claims")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              <h3 className={cn("text-lg font-semibold", text.primary)}>
                Claims ({userClaims.length})
              </h3>
            </div>
            {expandedSections.has("claims") ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {expandedSections.has("claims") && (
            <div className="space-y-4">
              {loading ? (
                <div className={cn("text-sm text-center py-4", text.muted)}>Yükleniyor...</div>
              ) : (
                <>
                  {userClaims.length > 0 ? (
                    <div className="space-y-2">
                      {userClaims.map((claim, idx) => (
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
                      Kullanıcının claim'i yok
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

        {/* User Logins Section */}
        <div className="border-t border-neutral-800/50 pt-6">
          <button
            onClick={() => toggleSection("logins")}
            className="w-full flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-green-400" />
              <h3 className={cn("text-lg font-semibold", text.primary)}>
                External Logins ({userLogins.length})
              </h3>
            </div>
            {expandedSections.has("logins") ? (
              <ChevronUp className="w-5 h-5 text-neutral-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-neutral-400" />
            )}
          </button>

          {expandedSections.has("logins") && (
            <div className="space-y-4">
              {loading ? (
                <div className={cn("text-sm text-center py-4", text.muted)}>Yükleniyor...</div>
              ) : (
                <>
                  {userLogins.length > 0 ? (
                    <div className="space-y-2">
                      {userLogins.map((login, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            "bg-neutral-800/50 border border-neutral-700/50"
                          )}
                        >
                          <div className="flex-1">
                            <div className={cn("text-sm font-medium", text.primary)}>
                              {login.providerDisplayName || login.loginProvider}
                            </div>
                            <div className={cn("text-xs font-mono", text.muted)}>
                              {login.providerKey}
                            </div>
                          </div>
                          <button
                            onClick={() => setShowDeleteLoginDialog({ loginProvider: login.loginProvider, providerKey: login.providerKey })}
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
                      Kullanıcının external login'i yok
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="border-t border-neutral-800/50 pt-6">
          <Link
            href="/users"
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg",
              "bg-neutral-800/50 hover:bg-neutral-800/70",
              "border border-neutral-700/50",
              "text-neutral-300 hover:text-white transition-all"
            )}
          >
            <X className="w-4 h-4" />
            Geri Dön
          </Link>
        </div>
      </div>

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

      {/* Add Role Dialog */}
      {showAddRoleDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
            "w-full max-w-md p-6 space-y-4"
          )}>
            <h3 className={cn("text-lg font-bold", text.primary)}>Rol Ekle</h3>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Rol *
              </label>
              <SelectBase
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                required
              >
                <option value="">Rol seçin</option>
                {roles
                  .filter(r => !userRoles.includes(r.name))
                  .map((role) => (
                    <option key={role.id} value={role.name}>
                      {role.name}
                    </option>
                  ))}
              </SelectBase>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddRole}
                disabled={pending}
                className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
              >
                <Save className="w-4 h-4" />
                {pending ? "Ekleniyor..." : "Ekle"}
              </button>
              <button
                onClick={() => {
                  setShowAddRoleDialog(false);
                  setSelectedRole("");
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

      {/* Delete Login Dialog */}
      {showDeleteLoginDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Login'i Sil"
          message={`"${showDeleteLoginDialog.loginProvider}" login'ini silmek istediğinize emin misiniz?`}
          confirmText="Evet, Sil"
          cancelText="İptal"
          variant="danger"
          onConfirm={handleDeleteLogin}
          onCancel={() => setShowDeleteLoginDialog(null)}
        />
      )}
    </>
  );
}

