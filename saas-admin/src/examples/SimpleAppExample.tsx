"use client";

// Basit kullanım örneği - app.tsx veya herhangi bir component'te kullanabilirsiniz

import { useState, useEffect } from "react";
import {
  getAllApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
  getAppDashboard,
  provisionApp,
} from "@/lib/appsService";
import type { AppDto, AppAddDto, AppUpdateDto } from "@/types/app";
import { Status, BillingPeriod, CurrencyCode } from "@/types/app";

export default function SimpleAppExample() {
  const [apps, setApps] = useState<AppDto[]>([]);
  const [loading, setLoading] = useState(false);

  // Sayfa yüklendiğinde tüm uygulamaları getir
  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await getAllApps();
      setApps(data);
    } catch (error) {
      console.error("Uygulamalar yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Yeni uygulama ekle
  const handleAdd = async () => {
    try {
      const newApp: AppAddDto = {
        name: "Yeni Uygulama",
        code: "YENI_APP",
        description: "Açıklama",
      };
      await createApp(newApp);
      await loadApps(); // Listeyi yenile
    } catch (error) {
      console.error("Uygulama eklenemedi:", error);
    }
  };

  // Uygulama güncelle
  const handleUpdate = async (app: AppDto) => {
    try {
      const updateData: AppUpdateDto = {
        id: app.id,
        name: app.name + " (Güncellendi)",
        code: app.code,
        description: app.description,
      };
      await updateApp(app.id, updateData);
      await loadApps(); // Listeyi yenile
    } catch (error) {
      console.error("Uygulama güncellenemedi:", error);
    }
  };

  // Uygulama sil
  const handleDelete = async (id: string) => {
    if (!confirm("Silmek istediğinize emin misiniz?")) return;
    try {
      await deleteApp(id);
      await loadApps(); // Listeyi yenile
    } catch (error) {
      console.error("Uygulama silinemedi:", error);
    }
  };

  // Dashboard bilgisi getir
  const handleDashboard = async (id: string) => {
    try {
      const dashboard = await getAppDashboard(id);
      console.log("Dashboard:", dashboard);
      alert(`Aktif Planlar: ${dashboard.plansActive}\nAktif Abonelikler: ${dashboard.subscriptionsActive}`);
    } catch (error) {
      console.error("Dashboard yüklenemedi:", error);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Uygulamalar</h1>

      <button
        onClick={handleAdd}
        className="mb-4 px-4 py-2 bg-blue-600 rounded-lg text-white"
      >
        Yeni Uygulama Ekle
      </button>

      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <div className="space-y-2">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <h3 className="font-semibold">{app.name}</h3>
                <p className="text-sm text-gray-500">{app.code}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdate(app)}
                  className="px-3 py-1 bg-yellow-600 rounded text-white text-sm"
                >
                  Güncelle
                </button>
                <button
                  onClick={() => handleDashboard(app.id)}
                  className="px-3 py-1 bg-green-600 rounded text-white text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  className="px-3 py-1 bg-red-600 rounded text-white text-sm"
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

