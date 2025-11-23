"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useNotificationHelpers } from "@/hooks/useNotifications";

export function useNotificationFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { notifySuccess, notifyError, notifyInfo } = useNotificationHelpers();
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    const notification = searchParams.get("notification");
    const type = searchParams.get("type") || "success";

    // Aynı bildirimi tekrar işleme (çift bildirim önleme)
    const notificationKey = `${notification}-${type}`;
    if (!notification || processedRef.current === notificationKey) {
      return;
    }

    processedRef.current = notificationKey;
    const decoded = decodeURIComponent(notification);
    
    switch (type) {
      case "success":
        notifySuccess(decoded);
        break;
      case "error":
        notifyError(decoded);
        break;
      case "info":
        notifyInfo(decoded);
        break;
      default:
        notifySuccess(decoded);
    }

    // URL'den parametreleri temizle
    const params = new URLSearchParams(searchParams.toString());
    params.delete("notification");
    params.delete("type");
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl);
    
    // Temizleme sonrası ref'i sıfırla (yeni bildirimler için)
    setTimeout(() => {
      processedRef.current = null;
    }, 100);
  }, [searchParams, router, notifySuccess, notifyError, notifyInfo]);
}

