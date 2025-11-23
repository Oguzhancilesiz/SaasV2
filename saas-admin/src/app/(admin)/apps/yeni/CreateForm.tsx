"use client";

import { useEffect, useState, useTransition } from "react";
import { useNotificationHelpers } from "@/hooks/useNotifications";
import { Save, X } from "lucide-react";
import { components, bg, border, text, blur, radius, transition } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function CreateForm({ action }: { action: (fd: FormData) => Promise<void> }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const { notifyError } = useNotificationHelpers();

  useEffect(() => {
    if (!code) setCode(toCode(name));
  }, [name]);

  return (
    <form
      action={(fd) => {
        setErr(null);
        start(async () => {
          try {
            await action(fd);
          } catch (e: any) {
            if (e?.digest?.startsWith("NEXT_REDIRECT") || 
                e?.message?.includes("NEXT_REDIRECT") ||
                e?.message?.includes("redirect")) {
              return;
            }
            const errorMessage = e?.message || "Bir hata oluştu";
            setErr(errorMessage);
            notifyError("Kayıt başarısız", errorMessage);
          }
        });
      }}
      className={cn(
        "max-w-2xl space-y-6",
        components.card,
        "p-6 sm:p-8"
      )}
    >
      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Uygulama Adı *</label>
        <InputBase
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Örn: FraoulaPT Mobile"
          required
        />
      </div>

      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Kod *</label>
        <InputBase
          name="code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Örn: FRAOULA_PT"
          required
        />
        <p className={cn("text-xs", text.disabled)}>
          Boş bırakırsanız ad'dan otomatik üretilecektir.
        </p>
      </div>

      <div className="space-y-2">
        <label className={cn("block text-sm font-medium", text.secondary)}>Açıklama</label>
        <TextareaBase name="description" placeholder="Uygulamanız hakkında kısa bir açıklama (isteğe bağlı)" />
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
          className={cn(components.buttonPrimary, "flex-1 disabled:opacity-50")}
          disabled={pending}
        >
          <Save className="w-4 h-4" />
          {pending ? "Oluşturuluyor..." : "Oluştur"}
        </button>

        <a
          href="/apps"
          className={components.buttonSecondary}
        >
          <X className="w-4 h-4" />
          İptal
        </a>
      </div>
    </form>
  );
}

function toCode(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .toUpperCase();
}

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
      className={cn(
        components.input,
        "min-h-[120px] resize-none",
        props.className
      )}
    />
  );
}
