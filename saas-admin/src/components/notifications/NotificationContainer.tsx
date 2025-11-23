"use client";

import { useNotifications } from "@/contexts/NotificationContext";
import NotificationToast from "./NotificationToast";

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotifications();

  // Son 5 bildirimi göster (performans için)
  const visibleNotifications = notifications.slice(0, 5);

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-h-[calc(100vh-5rem)] overflow-y-auto pointer-events-none">
      {visibleNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <NotificationToast
            notification={notification}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </div>
  );
}
