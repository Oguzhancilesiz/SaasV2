"use client";

import { useNotificationHelpers } from "@/hooks/useNotifications";

export default function NotificationDemo() {
  const { notifySuccess, notifyError, notifyWarning, notifyInfo } = useNotificationHelpers();

  return (
    <div className="rounded-2xl border border-neutral-800 p-6 bg-neutral-900">
      <h2 className="text-lg font-semibold mb-4">Bildirim Testi</h2>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => notifySuccess("Başarılı!", "İşlem başarıyla tamamlandı.")}
          className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors text-sm font-medium"
        >
          Başarı Bildirimi
        </button>
        <button
          onClick={() => notifyError("Hata!", "Bir hata oluştu.")}
          className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
        >
          Hata Bildirimi
        </button>
        <button
          onClick={() => notifyWarning("Uyarı!", "Lütfen dikkat edin.")}
          className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm font-medium"
        >
          Uyarı Bildirimi
        </button>
        <button
          onClick={() => notifyInfo("Bilgi", "Yeni bir güncelleme mevcut.")}
          className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium"
        >
          Bilgi Bildirimi
        </button>
      </div>
      <p className="text-xs text-neutral-500 mt-4">
        Bildirimleri test etmek için yukarıdaki butonlara tıklayın. Sağ üstteki zil ikonuna tıklayarak tüm bildirimleri görebilirsiniz.
      </p>
    </div>
  );
}


