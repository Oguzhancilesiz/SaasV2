"use client";

import { useState, useTransition } from "react";
import { Power, Loader2 } from "lucide-react";
import { toggleAppStatus } from "./actions";
import ConfirmDialog from "@/components/notifications/ConfirmDialog";
import { components } from "@/lib/theme";
import { cn } from "@/lib/utils";

export default function ToggleStatusButton({ id, currentStatus }: { id: string; currentStatus: number }) {
  const [pending, start] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  const isActive = currentStatus === 1;

  const handleConfirm = () => {
    setShowDialog(false);
    start(() => toggleAppStatus(id, currentStatus));
  };

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className={cn(
          components.buttonSecondary,
          "text-xs sm:text-sm",
          isActive
            ? "bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
        )}
        disabled={pending}
        title={isActive ? "Pasife al" : "Aktif et"}
      >
        {pending ? (
          <>
            <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
            <span className="hidden sm:inline">İşleniyor…</span>
          </>
        ) : (
          <>
            <Power className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{isActive ? "Pasife Al" : "Aktif Et"}</span>
          </>
        )}
      </button>

      <ConfirmDialog
        isOpen={showDialog}
        title={isActive ? "Uygulamayı Pasife Al" : "Uygulamayı Aktif Et"}
        message={
          isActive
            ? "Bu uygulamayı pasife almak istediğinize emin misiniz? Pasife alınan uygulamalar kullanılamayacaktır."
            : "Bu uygulamayı aktif etmek istediğinize emin misiniz? Aktif edilen uygulamalar kullanılabilir olacaktır."
        }
        confirmText={isActive ? "Evet, Pasife Al" : "Evet, Aktif Et"}
        cancelText="İptal"
        variant={isActive ? "warning" : "info"}
        onConfirm={handleConfirm}
        onCancel={() => setShowDialog(false)}
      />
    </>
  );
}
