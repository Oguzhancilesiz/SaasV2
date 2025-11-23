"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Notification, NotificationContextType, NotificationType } from "@/types/notification";

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
      const newNotification: Notification = {
        ...notification,
        id: crypto.randomUUID(),
        timestamp: new Date(),
        read: false,
      };

      setNotifications((prev) => [newNotification, ...prev]);

      // Otomatik kaldırma (5 saniye sonra)
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== newNotification.id));
      }, 5000);
    },
    []
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
}

// Yardımcı fonksiyonlar - kolay kullanım için
export function useNotificationHelpers() {
  const { addNotification } = useNotifications();

  const notifySuccess = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: "success", title, message });
    },
    [addNotification]
  );

  const notifyError = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: "error", title, message });
    },
    [addNotification]
  );

  const notifyWarning = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: "warning", title, message });
    },
    [addNotification]
  );

  const notifyInfo = useCallback(
    (title: string, message?: string) => {
      addNotification({ type: "info", title, message });
    },
    [addNotification]
  );

  return {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
  };
}


