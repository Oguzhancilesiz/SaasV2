"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Notification } from "@/types/notification";

type NotificationToastProps = {
  notification: Notification;
  onClose: () => void;
};

const icons = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  error: "bg-red-500/10 border-red-500/20 text-red-400",
  warning: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
  info: "bg-blue-500/10 border-blue-500/20 text-blue-400",
};

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = icons[notification.type];

  useEffect(() => {
    // Animasyon için gecikme
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  return (
    <div
      className={`
        relative w-full max-w-sm p-4 rounded-lg border backdrop-blur-sm
        transition-all duration-300 ease-in-out
        ${colors[notification.type]}
        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm mb-1">{notification.title}</h4>
          {notification.message && (
            <p className="text-xs opacity-80 leading-relaxed">{notification.message}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-white/5 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


