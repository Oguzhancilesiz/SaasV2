"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, AlertCircle, Info, AlertTriangle, X, CheckCheck } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Notification, NotificationType } from "@/types/notification";

const icons: Record<NotificationType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors: Record<NotificationType, string> = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-yellow-400",
  info: "text-blue-400",
};

export default function NotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Az önce";
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString("tr-TR");
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-neutral-800 transition-colors"
        title="Bildirimler"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-neutral-900 border border-neutral-800 rounded-lg shadow-xl overflow-hidden z-50">
          {/* Header */}
          <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="font-semibold text-sm">Bildirimler</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="p-1.5 rounded hover:bg-neutral-800 transition-colors"
                  title="Tümünü okundu işaretle"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={clearAll}
                className="p-1.5 rounded hover:bg-neutral-800 transition-colors"
                title="Tümünü temizle"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Henüz bildirim yok</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-800">
                {notifications.map((notification) => {
                  const Icon = icons[notification.type];
                  const isUnread = !notification.read;

                  return (
                    <div
                      key={notification.id}
                      className={`
                        group p-4 hover:bg-neutral-800/50 transition-colors cursor-pointer
                        ${isUnread ? "bg-neutral-800/30" : ""}
                      `}
                      onClick={() => !notification.read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors[notification.type]}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{notification.title}</h4>
                            {isUnread && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          {notification.message && (
                            <p className="text-xs text-neutral-400 mb-2 leading-relaxed">
                              {notification.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-neutral-500">
                              {formatTime(notification.timestamp)}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeNotification(notification.id);
                              }}
                              className="p-1 rounded hover:bg-neutral-700 transition-all opacity-50 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
