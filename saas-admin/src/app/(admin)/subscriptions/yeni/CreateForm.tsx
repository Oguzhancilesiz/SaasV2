"use client";

import type { AppDto } from "@/types/app";
import type { PlanDto } from "@/types/plan";
import type { UserDto } from "@/types/user";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, ShoppingCart, Package, User, Calendar, RefreshCw } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { createSubscription } from "@/lib/subscriptionsService";
import { RenewalPolicy } from "@/types/plan";

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

export default function CreateForm({ apps, plans, users, defaultAppId, defaultUserId, defaultPlanId }: { 
  apps: AppDto[]; 
  plans: PlanDto[]; 
  users: UserDto[];
  defaultAppId?: string;
  defaultUserId?: string;
  defaultPlanId?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    appId: defaultAppId || "",
    userId: defaultUserId || "",
    planId: defaultPlanId || "",
    startAt: new Date().toISOString().slice(0, 16),
    endAt: "",
    renewAt: "",
    renewalPolicy: RenewalPolicy.Auto,
    externalPaymentRef: "",
  });

  // Seçili app'e göre planları filtrele
  const filteredPlans = formData.appId 
    ? plans.filter(p => p.appId === formData.appId)
    : plans;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.userId || !formData.planId) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        await createSubscription({
          appId: formData.appId,
          userId: formData.userId,
          planId: formData.planId,
          startAt: formData.startAt ? new Date(formData.startAt).toISOString() : new Date().toISOString(),
          endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
          renewAt: formData.renewAt ? new Date(formData.renewAt).toISOString() : null,
          renewalPolicy: formData.renewalPolicy,
          externalPaymentRef: formData.externalPaymentRef.trim() || null,
        });
        
        notifySuccess("Başarılı", "Abonelik oluşturuldu");
        router.push(`/subscriptions?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Abonelik oluşturulamadı";
        setErr(errorMessage);
        notifyError("Oluşturma başarısız", errorMessage);
      }
    });
  };

  return (
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
          Başlangıç Tarihi
        </label>
        <InputBase
          type="datetime-local"
          value={formData.startAt}
          onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
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
          Yenileme Politikası
        </label>
        <SelectBase
          value={formData.renewalPolicy}
          onChange={(e) => setFormData({ ...formData, renewalPolicy: Number(e.target.value) as RenewalPolicy })}
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
          {pending ? "Oluşturuluyor..." : "Abonelik Oluştur"}
        </button>

        <a
          href="/subscriptions"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

