"use client";

import { useState, useTransition } from "react";
import { Trash2, Loader2 } from "lucide-react";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import { components } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function ConfirmButton({
  text,
  confirmText,
  onConfirm,
}: {
  text: string;
  confirmText: string;
  onConfirm: () => Promise<void>;
}) {
  const [pending, start] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
    <button
        onClick={() => setShowDialog(true)}
        className={cn(
          components.buttonSecondary,
          "px-3 py-2 text-xs sm:text-sm",
          "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
        )}
        disabled={pending}
        title={text || "Sil"}
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            <span className="hidden sm:inline">İşleniyor…</span>
          </>
        ) : (
          <>
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {text && <span className="hidden sm:inline">{text}</span>}
          </>
        )}
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        title="Uygulamayı Pasife Al"
        message={confirmText}
        confirmText="Evet, Pasife Al"
        cancelText="İptal"
        variant="danger"
        onConfirm={() => {
          setShowDialog(false);
          start(() => onConfirm());
        }}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
