"use client";

import { X, AlertTriangle } from "lucide-react";
import { zIndex, bg, border, text, blur, radius, transition, components } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
};

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Onayla",
  cancelText = "İptal",
  onConfirm,
  onCancel,
  variant = "danger",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: "text-red-400",
      border: "border-red-500/20",
      bg: "bg-red-500/10",
      button: "bg-red-600 hover:bg-red-700 text-white",
    },
    warning: {
      icon: "text-orange-400",
      border: "border-orange-500/20",
      bg: "bg-orange-500/10",
      button: "bg-orange-600 hover:bg-orange-700 text-white",
    },
    info: {
      icon: "text-blue-400",
      border: "border-blue-500/20",
      bg: "bg-blue-500/10",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: zIndex.modal }}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0",
          bg.overlay,
          blur.md,
          transition.default
        )}
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={cn(
          "relative w-full max-w-md",
          bg.surface,
          border.default,
          style.border,
          "border",
          blur.md,
          radius.lg,
          "p-6",
          "shadow-xl shadow-black/50"
        )}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
            style.bg,
            style.border,
            "border"
          )}>
            <AlertTriangle className={cn("w-5 h-5", style.icon)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={cn("font-semibold text-lg mb-2", text.primary)}>{title}</h3>
            <p className={cn("text-sm mb-6", text.muted)}>{message}</p>

            {/* Actions */}
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={onCancel}
                className={cn(
                  components.buttonSecondary,
                  "text-sm"
                )}
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium",
                  transition.default,
                  style.button
                )}
              >
                {confirmText}
              </button>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onCancel}
            className={cn(
              "p-1.5 rounded-lg hover:bg-neutral-800/50",
              transition.default,
              text.muted,
              "flex-shrink-0"
            )}
            title="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
