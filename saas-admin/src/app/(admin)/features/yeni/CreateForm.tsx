"use client";

import type { AppDto } from "@/types/app";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X } from "lucide-react";
import { components, text } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { createFeature } from "@/lib/featuresService";

function InputBase(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(components.input, props.className)}
    />
  );
}

function TextareaBase(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(components.input, "min-h-[120px] resize-none", props.className)}
    />
  );
}

function SelectBase(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(components.input, props.className)} />
  );
}

export default function CreateForm({ apps, defaultAppId }: { apps: AppDto[]; defaultAppId?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifySuccess, notifyError } = useNotificationHelpers();

  const [formData, setFormData] = useState({
    appId: defaultAppId || "",
    name: "",
    key: "",
    unit: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    if (!formData.appId || !formData.name || !formData.key || !formData.unit) {
      setErr("Lütfen tüm zorunlu alanları doldurun.");
      return;
    }

    start(async () => {
      try {
        await createFeature({
          appId: formData.appId,
          name: formData.name.trim(),
          key: formData.key.trim().toLowerCase().replace(/\s+/g, '.'),
          unit: formData.unit.trim(),
          description: formData.description.trim() || undefined,
        });
        
        notifySuccess("Başarılı", "Özellik oluşturuldu");
        router.push(`/features?appId=${formData.appId}`);
        router.refresh();
      } catch (error: any) {
        const errorMessage = error?.message || "Özellik oluşturulamadı";
        setErr(errorMessage);
        notifyError("Oluşturma başarısız", errorMessage);
      }
    });
  };

  const handleKeyChange = (value: string) => {
    // Key'i otomatik formatla: küçük harf, boşlukları nokta ile değiştir
    const formatted = value.toLowerCase().replace(/\s+/g, '.');
    setFormData({ ...formData, key: formatted });
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
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Uygulama *</label>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.secondary)}>Özellik Adı *</label>
          <InputBase
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="örn: API İstekleri"
          />
        </div>
        <div className="space-y-2">
          <label className={cn("block text-sm font-medium", text.secondary)}>Anahtar (Key) *</label>
          <InputBase
            value={formData.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            required
            placeholder="örn: api.requests"
          />
          <p className={cn("text-xs", text.muted)}>
            Otomatik formatlanır: küçük harf, boşluklar nokta ile değiştirilir
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Birim *</label>
        <InputBase
          value={formData.unit}
          onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
          required
          placeholder="örn: request, GB, seat"
        />
        <p className={cn("text-xs", text.muted)}>
          Özelliğin ölçü birimi (örnek: request, GB, seat, hour)
        </p>
      </div>

      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Açıklama</label>
        <TextareaBase
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Özellik hakkında açıklama..."
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
          {pending ? "Oluşturuluyor..." : "Özelliği Oluştur"}
        </button>

        <a
          href="/features"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

