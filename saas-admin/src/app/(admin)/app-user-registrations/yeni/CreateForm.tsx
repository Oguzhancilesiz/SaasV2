"use client";

import type { AppDto } from "@/types/app";
import type { UserDto } from "@/types/user";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X, UserPlus, Package, User, Globe, Hash, Calendar } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { createAppUserRegistration } from "@/lib/appUserRegistrationsService";

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

export default function CreateForm({ apps, users, defaultAppId, defaultUserId }: { apps: AppDto[]; users: UserDto[]; defaultAppId?: string; defaultUserId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    appId: defaultAppId || "",
    userId: defaultUserId || "",
    registeredAt: new Date().toISOString().slice(0, 16),
    provider: "",
    externalId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.userId) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        await createAppUserRegistration({
          appId: formData.appId,
          userId: formData.userId,
          registeredAt: formData.registeredAt ? new Date(formData.registeredAt).toISOString() : null,
          provider: formData.provider.trim() || null,
          externalId: formData.externalId.trim() || null,
        });
        
        notifySuccess("Başarılı", "Kullanıcı kaydı oluşturuldu");
        router.push(`/app-user-registrations?appId=${formData.appId}&userId=${formData.userId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Kullanıcı kaydı oluşturulamadı";
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
          onChange={(e) => setFormData({ ...formData, appId: e.target.value })}
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

      {/* Kayıt Tarihi */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Calendar className="w-4 h-4" />
          Kayıt Tarihi
        </label>
        <InputBase
          type="datetime-local"
          value={formData.registeredAt}
          onChange={(e) => setFormData({ ...formData, registeredAt: e.target.value })}
        />
      </div>

      {/* Provider */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Globe className="w-4 h-4" />
          Provider (Opsiyonel)
        </label>
        <InputBase
          type="text"
          value={formData.provider}
          onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
          placeholder="e-posta, apple, google, vb."
        />
      </div>

      {/* External ID */}
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium flex items-center gap-2", text.secondary)}>
          <Hash className="w-4 h-4" />
          External ID (Opsiyonel)
        </label>
        <InputBase
          type="text"
          value={formData.externalId}
          onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
          placeholder="Dış sağlayıcı kimliği"
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
          {pending ? "Oluşturuluyor..." : "Kullanıcı Kaydı Oluştur"}
        </button>

        <a
          href="/app-user-registrations"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

