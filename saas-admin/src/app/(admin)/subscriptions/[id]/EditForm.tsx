"use client";

import type { SubscriptionDto, SubscriptionUpdateDto, SubscriptionChangeLogDto } from "@/types/subscription";
import type { AppDto } from "@/types/app";
import type { PlanDto } from "@/types/plan";
import type { UserDto } from "@/types/user";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, ShoppingCart, Package, User, Calendar, RefreshCw, Trash2, RotateCcw } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { updateSubscription, deleteSubscription, changeSubscriptionPlan, cancelSubscription, rebuildSubscriptionItems, getSubscriptionChanges } from "@/lib/subscriptionsService";
import { RenewalPolicy } from "@/types/plan";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";

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

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(components.input, "min-h-[120px] resize-y", props.className)}
    />
  );
}

export default function EditForm({ subscription: initialSubscription, apps, plans, users }: { 
  subscription: SubscriptionDto; 
  apps: AppDto[]; 
  plans: PlanDto[]; 
  users: UserDto[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedNewPlanId, setSelectedNewPlanId] = useState("");
  const [changePlanReason, setChangePlanReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelEndAt, setCancelEndAt] = useState("");
  const { notifySuccess, notifyError } = useNotificationHelpers();
  const [changeLogOpen, setChangeLogOpen] = useState(false);
  const [changeLogLoading, setChangeLogLoading] = useState(false);
  const [changeLog, setChangeLog] = useState<SubscriptionChangeLogDto[] | null>(null);
  const [changeLogError, setChangeLogError] = useState<string | null>(null);
  const openChangeLog = async () => {
    setChangeLogOpen(true);
    setChangeLogError(null);
    if (changeLog !== null) {
      return;
    }
    setChangeLogLoading(true);
    try {
      const history = await getSubscriptionChanges(initialSubscription.id);
      setChangeLog(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Geçmiş kayıtlar yüklenemedi.";
      setChangeLogError(message);
    } finally {
      setChangeLogLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    appId: initialSubscription.appId,
    userId: initialSubscription.userId,
    planId: initialSubscription.planId,
    startAt: initialSubscription.startAt ? new Date(initialSubscription.startAt).toISOString().slice(0, 16) : "",
    endAt: initialSubscription.endAt ? new Date(initialSubscription.endAt).toISOString().slice(0, 16) : "",
    renewAt: initialSubscription.renewAt ? new Date(initialSubscription.renewAt).toISOString().slice(0, 16) : "",
    renewalPolicy: initialSubscription.renewalPolicy,
    externalPaymentRef: initialSubscription.externalPaymentRef || "",
  });

  // Seçili app'e göre planları filtrele
  const filteredPlans = formData.appId 
    ? plans.filter(p => p.appId === formData.appId)
    : plans;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.userId || !formData.planId) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        const updateData: SubscriptionUpdateDto = {
          id: initialSubscription.id,
          appId: formData.appId,
          userId: formData.userId,
          planId: formData.planId,
          startAt: formData.startAt ? new Date(formData.startAt).toISOString() : new Date().toISOString(),
          endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
          renewAt: formData.renewAt ? new Date(formData.renewAt).toISOString() : null,
          renewalPolicy: formData.renewalPolicy,
          externalPaymentRef: formData.externalPaymentRef.trim() || null,
        };
        
        await updateSubscription(initialSubscription.id, updateData);
        
        notifySuccess("Başarılı", "Abonelik güncellendi");
        router.push(`/subscriptions?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Abonelik güncellenemedi";
        setErr(message);
        notifyError("Güncelleme başarısız", message);
      }
    });
  };

  const handleDelete = async () => {
    start(async () => {
      try {
        await deleteSubscription(initialSubscription.id);
        notifySuccess("Başarılı", "Abonelik silindi");
        router.push("/subscriptions");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Abonelik silinemedi";
        notifyError("Hata", message);
      }
    });
  };

  const handleCancel = async () => {
    start(async () => {
      try {
        await cancelSubscription(initialSubscription.id, {
          endAt: cancelEndAt ? new Date(cancelEndAt).toISOString() : null,
          reason: cancelReason.trim() || null,
        });
        notifySuccess("Başarılı", "Abonelik iptal edildi");
        setCancelReason("");
        setCancelEndAt("");
        router.push(`/subscriptions?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Abonelik iptal edilemedi";
        notifyError("Hata", message);
      }
    });
  };

  const handleChangePlan = async () => {
    if (!selectedNewPlanId) {
      notifyError("Hata", "Lütfen yeni bir plan seçin");
      return;
    }

    start(async () => {
      try {
        await changeSubscriptionPlan(initialSubscription.id, {
          newPlanId: selectedNewPlanId,
          reason: changePlanReason.trim() || null,
        });
        notifySuccess("Başarılı", "Plan değiştirildi");
        setSelectedNewPlanId("");
        setChangePlanReason("");
        router.push(`/subscriptions?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Plan değiştirilemedi";
        notifyError("Hata", message);
      }
    });
  };

  const handleRebuildItems = async () => {
    start(async () => {
      try {
        await rebuildSubscriptionItems(initialSubscription.id);
        notifySuccess("Başarılı", "Subscription item'lar yeniden oluşturuldu");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Item&apos;lar yeniden oluşturulamadı";
        notifyError("Hata", message);
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
        {/* Uygulama Seçimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Package className="w-4 h-4" />
            Uygulama *
          </label>
          <SelectBase
            value={formData.appId}
            onChange={(e) => {
              setFormData({ ...formData, appId: e.target.value, planId: "" });
            }}
            required
          >
            <option value="">Uygulama seçin</option>
            {apps.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name} ({app.code})
              </option>
            ))}
          </SelectBase>
        </div>

        {/* Kullanıcı Seçimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <User className="w-4 h-4" />
            Kullanıcı *
          </label>
          <SelectBase
            value={formData.userId}
            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
            required
          >
            <option value="">Kullanıcı seçin</option>
            {users.map((user) => (
              <option key={user.userId} value={user.userId}>
                {user.email || user.userName || user.userId}
              </option>
            ))}
          </SelectBase>
        </div>

        {/* Plan Seçimi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <ShoppingCart className="w-4 h-4" />
            Plan *
          </label>
          <SelectBase
            value={formData.planId}
            onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
            required
            disabled={!formData.appId}
          >
            <option value="">{formData.appId ? "Plan seçin" : "Önce uygulama seçin"}</option>
            {filteredPlans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.code})
              </option>
            ))}
          </SelectBase>
        </div>

        {/* Başlangıç Tarihi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Calendar className="w-4 h-4" />
            Başlangıç Tarihi *
          </label>
          <InputBase
            type="datetime-local"
            value={formData.startAt}
            onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
            required
          />
        </div>

        {/* Bitiş Tarihi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <Calendar className="w-4 h-4" />
            Bitiş Tarihi (Opsiyonel)
          </label>
          <InputBase
            type="datetime-local"
            value={formData.endAt}
            onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
          />
        </div>

        {/* Yenileme Tarihi */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <RefreshCw className="w-4 h-4" />
            Yenileme Tarihi (Opsiyonel)
          </label>
          <InputBase
            type="datetime-local"
            value={formData.renewAt}
            onChange={(e) => setFormData({ ...formData, renewAt: e.target.value })}
          />
        </div>

        {/* Renewal Policy */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            <RefreshCw className="w-4 h-4" />
            Yenileme Politikası *
          </label>
          <SelectBase
            value={formData.renewalPolicy}
            onChange={(e) => setFormData({ ...formData, renewalPolicy: Number(e.target.value) as RenewalPolicy })}
            required
          >
            <option value={RenewalPolicy.None}>Yok</option>
            <option value={RenewalPolicy.Auto}>Otomatik</option>
            <option value={RenewalPolicy.Manual}>Manuel</option>
          </SelectBase>
        </div>

        {/* External Payment Ref */}
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
            External Payment Ref (Opsiyonel)
          </label>
          <InputBase
            type="text"
            value={formData.externalPaymentRef}
            onChange={(e) => setFormData({ ...formData, externalPaymentRef: e.target.value })}
            placeholder="Dış ödeme referansı"
          />
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
            onClick={handleRebuildItems}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-blue-500/10 text-blue-400 border border-blue-500/20",
              "hover:bg-blue-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
            title="Subscription Item&apos;ları Yeniden Oluştur"
          >
            <RotateCcw className="w-4 h-4" />
            Item&apos;ları Yenile
          </button>

          <button
            type="button"
            onClick={() => setShowChangePlanDialog(true)}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-purple-500/10 text-purple-400 border border-purple-500/20",
              "hover:bg-purple-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
          >
            <RefreshCw className="w-4 h-4" />
            Plan Değiştir
          </button>

          <button
            type="button"
            onClick={openChangeLog}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-neutral-700/20 text-neutral-200 border border-neutral-700",
              "hover:bg-neutral-700/40 transition-all",
              "flex items-center gap-2"
            )}
          >
            Geçmiş
          </button>

          <button
            type="button"
            onClick={() => setShowCancelDialog(true)}
            disabled={pending}
            className={cn(
              "px-4 py-2.5 rounded-xl",
              "bg-orange-500/10 text-orange-400 border border-orange-500/20",
              "hover:bg-orange-500/20 transition-all",
              "flex items-center gap-2",
              pending && "opacity-50 cursor-not-allowed"
            )}
          >
            <X className="w-4 h-4" />
            İptal Et
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

          <button
            type="button"
            onClick={() => router.back()}
            className={components.buttonSecondary}
          >
            <X className="w-4 h-4" />
            İptal
          </button>
        </div>
      </form>

      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={true}
          title="Aboneliği Sil"
          message="Bu aboneliği silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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

      {showCancelDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
            "w-full max-w-md p-6 space-y-4"
          )}>
            <h3 className={cn("text-lg font-bold", text.primary)}>Aboneliği İptal Et</h3>
            <p className={cn("text-sm", text.muted)}>
              İsterseniz planın hangi tarihte sonlanacağını ve iptal sebebini belirtebilirsiniz.
            </p>

            <div className="space-y-2">
              <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
                <Calendar className="w-4 h-4" />
                İptal Tarihi (Opsiyonel)
              </label>
              <InputBase
                type="datetime-local"
                value={cancelEndAt}
                onChange={(e) => setCancelEndAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                İptal Nedeni (Opsiyonel)
              </label>
              <TextareaBase
                placeholder="Örn: Müşteri talebi, ödeme başarısızlığı vb."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  handleCancel();
                  setShowCancelDialog(false);
                }}
                disabled={pending}
                className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
              >
                <X className="w-4 h-4" />
                {pending ? "İptal ediliyor..." : "Aboneliği İptal Et"}
              </button>
              <button
                onClick={() => {
                  setShowCancelDialog(false);
                  setCancelReason("");
                  setCancelEndAt("");
                }}
                className={components.buttonSecondary}
              >
                <X className="w-4 h-4" />
                Vazgeç
              </button>
            </div>
          </div>
        </div>
      )}

      {showChangePlanDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={cn(
            "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
            "w-full max-w-md p-6 space-y-4"
          )}>
            <h3 className={cn("text-lg font-bold", text.primary)}>Plan Değiştir</h3>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Yeni Plan *
              </label>
              <SelectBase
                value={selectedNewPlanId}
                onChange={(e) => setSelectedNewPlanId(e.target.value)}
                required
              >
                <option value="">Plan seçin</option>
                {filteredPlans
                  .filter(p => p.id !== formData.planId)
                  .map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.code})
                    </option>
                  ))}
              </SelectBase>
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-medium", text.secondary)}>
                Değişiklik Nedeni (Opsiyonel)
              </label>
              <TextareaBase
                placeholder="Plan değişikliğinin nedenini yazabilirsiniz."
                value={changePlanReason}
                onChange={(e) => setChangePlanReason(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleChangePlan}
                disabled={pending || !selectedNewPlanId}
                className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
              >
                <Save className="w-4 h-4" />
                {pending ? "Değiştiriliyor..." : "Plan Değiştir"}
              </button>
              <button
                onClick={() => {
                  setShowChangePlanDialog(false);
                  setSelectedNewPlanId("");
                  setChangePlanReason("");
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

      {changeLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className={cn(
            "bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl",
            "w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
          )}>
            <div className="flex items-center justify-between border-b border-neutral-800 px-6 py-4">
              <h3 className={cn("text-lg font-semibold", text.primary)}>Abonelik Geçmişi</h3>
              <button
                onClick={() => setChangeLogOpen(false)}
                className={cn(
                  "p-2 rounded-full hover:bg-neutral-800/60 transition",
                  text.muted
                )}
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {changeLogLoading && (
                <div className="flex items-center justify-center py-12 text-neutral-400">
                  Geçmiş kayıtlar yükleniyor...
                </div>
              )}

              {changeLogError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {changeLogError}
                </div>
              )}

              {!changeLogLoading && !changeLogError && changeLog && changeLog.length === 0 && (
                <div className="flex items-center justify-center py-12 text-neutral-400 text-sm">
                  Bu abonelik için geçmiş kayıt bulunamadı.
                </div>
              )}

              {!changeLogLoading && !changeLogError && changeLog && changeLog.length > 0 && (
                <div className="space-y-6">
                  {changeLog.map((entry) => (
                    <div
                      key={entry.id}
                      className={cn(
                        "border border-neutral-800/80 rounded-xl p-4",
                        "bg-neutral-900/60"
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            getChangeTypeStyle(entry.changeType)
                          )}>
                            {mapChangeType(entry.changeType)}
                          </span>
                          <span className={cn("text-sm text-neutral-400")}>
                            {formatDate(entry.effectiveDate)}
                          </span>
                        </div>
                        {entry.invoiceId && (
                          <span className="text-xs text-neutral-500">
                            Fatura ID: {entry.invoiceId}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-neutral-300">
                        <div>
                          <span className="text-neutral-500">Plan:</span>{" "}
                          <span>{displayPlan(entry)}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Tutar:</span>{" "}
                          <span>{displayAmount(entry)}</span>
                        </div>
                        {entry.reason && (
                          <div className="md:col-span-2">
                            <span className="text-neutral-500">Not:</span>{" "}
                            <span>{entry.reason}</span>
                          </div>
                        )}
                        {entry.metadata && (
                          <div className="md:col-span-2">
                            <span className="text-neutral-500">Ek Bilgi:</span>
                            <pre className="mt-2 bg-black/30 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400 overflow-x-auto">
                              {entry.metadata}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getChangeTypeStyle(changeType: SubscriptionChangeLogDto["changeType"]) {
  switch (changeType) {
    case "Renewed":
      return "bg-green-500/10 text-green-300 border border-green-500/20";
    case "PlanChanged":
      return "bg-purple-500/10 text-purple-300 border border-purple-500/20";
    case "Cancelled":
      return "bg-orange-500/10 text-orange-300 border border-orange-500/20";
    case "Created":
      return "bg-blue-500/10 text-blue-300 border border-blue-500/20";
    default:
      return "bg-neutral-700/40 text-neutral-200 border border-neutral-700/60";
  }
}

function mapChangeType(changeType: SubscriptionChangeLogDto["changeType"]) {
  switch (changeType) {
    case "Created":
      return "Oluşturuldu";
    case "Renewed":
      return "Yenilendi";
    case "PlanChanged":
      return "Plan Değişti";
    case "Cancelled":
      return "İptal";
    case "Reactivated":
      return "Yeniden Aktif";
    case "PriceUpdated":
      return "Fiyat Güncellendi";
    case "ManualAdjustment":
      return "Manuel Güncelleme";
    default:
      return changeType;
  }
}

function displayPlan(entry: SubscriptionChangeLogDto) {
  const parts = [];
  if (entry.oldPlanId && entry.newPlanId && entry.oldPlanId !== entry.newPlanId) {
    parts.push(`${entry.oldPlanId} → ${entry.newPlanId}`);
  } else if (entry.newPlanId) {
    parts.push(entry.newPlanId);
  } else if (entry.oldPlanId) {
    parts.push(entry.oldPlanId);
  }
  return parts.length > 0 ? parts.join("") : "—";
}

function displayAmount(entry: SubscriptionChangeLogDto) {
  if (entry.newAmount == null) {
    return "—";
  }
  const currency = entry.currency ?? "TRY";
  if (entry.oldAmount != null && entry.oldAmount !== entry.newAmount) {
    return `${entry.oldAmount.toFixed(2)} → ${entry.newAmount.toFixed(2)} ${currency}`;
  }
  return `${entry.newAmount.toFixed(2)} ${currency}`;
}

function formatDate(date: string) {
  const d = new Date(date);
  return d.toLocaleString();
}

