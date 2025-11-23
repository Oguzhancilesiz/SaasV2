"use client";

// Bu dosya AppsController metodlarını nasıl kullanacağınızı gösterir
// Gerçek projenizde bu kodu app.tsx veya ilgili component'lere ekleyebilirsiniz

import { useState, useEffect } from "react";
import {
  getAllApps,
  getAppById,
  getAppByCode,
  createApp,
  updateApp,
  deleteApp,
  getAppDashboard,
  getAppDashboardsBatch,
  provisionApp,
} from "@/lib/appsService";
import type {
  AppDto,
  AppAddDto,
  AppUpdateDto,
  AppDashboardSummary,
  AppProvisionRequest,
  AppProvisionResult,
} from "@/types/app";
import { Status, BillingPeriod, CurrencyCode } from "@/types/app";

export default function AppServiceExample() {
  const [apps, setApps] = useState<AppDto[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppDto | null>(null);
  const [dashboard, setDashboard] = useState<AppDashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Tüm uygulamaları getir
  const loadAllApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllApps();
      setApps(data);
    } catch (err: any) {
      setError(err.message || "Uygulamalar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 2. ID ile uygulama getir
  const loadAppById = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const app = await getAppById(id);
      setSelectedApp(app);
    } catch (err: any) {
      setError(err.message || "Uygulama yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 3. Kod ile uygulama getir
  const loadAppByCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const app = await getAppByCode(code);
      setSelectedApp(app);
    } catch (err: any) {
      setError(err.message || "Uygulama yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 4. Yeni uygulama oluştur
  const handleCreateApp = async () => {
    setLoading(true);
    setError(null);
    try {
      const newApp: AppAddDto = {
        name: "Yeni Uygulama",
        code: "YENI_APP",
        description: "Bu yeni bir uygulama",
      };
      const created = await createApp(newApp);
      setSelectedApp(created);
      await loadAllApps(); // Liste güncellenir
    } catch (err: any) {
      setError(err.message || "Uygulama oluşturulurken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 5. Uygulama güncelle
  const handleUpdateApp = async (id: string) => {
    if (!selectedApp) return;
    setLoading(true);
    setError(null);
    try {
      const updateData: AppUpdateDto = {
        id: selectedApp.id,
        name: selectedApp.name + " (Güncellendi)",
        code: selectedApp.code,
        description: selectedApp.description,
      };
      await updateApp(id, updateData);
      await loadAppById(id); // Güncellenmiş veriyi yükle
      await loadAllApps();
    } catch (err: any) {
      setError(err.message || "Uygulama güncellenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 6. Uygulama sil
  const handleDeleteApp = async (id: string) => {
    if (!confirm("Bu uygulamayı silmek istediğinize emin misiniz?")) return;
    setLoading(true);
    setError(null);
    try {
      await deleteApp(id);
      await loadAllApps(); // Liste güncellenir
      setSelectedApp(null);
    } catch (err: any) {
      setError(err.message || "Uygulama silinirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 7. Dashboard özeti getir
  const loadDashboard = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await getAppDashboard(id);
      setDashboard(dashboardData);
    } catch (err: any) {
      setError(err.message || "Dashboard yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 8. Toplu dashboard özetleri getir
  const loadDashboardsBatch = async (ids: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const dashboards = await getAppDashboardsBatch(ids);
      console.log("Toplu dashboard verileri:", dashboards);
    } catch (err: any) {
      setError(err.message || "Toplu dashboard yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // 9. Provision (Uygulama sağlama) - Yeni uygulama, planlar, API key oluştur
  const handleProvision = async () => {
    setLoading(true);
    setError(null);
    try {
      const provisionRequest: AppProvisionRequest = {
        name: "Sağlanmış Uygulama",
        code: "PROVISIONED_APP",
        description: "Provision ile oluşturuldu",
        plans: [
          {
            name: "Free Plan",
            code: "FREE",
            description: "Ücretsiz plan",
            trialDays: 14,
            billingInterval: BillingPeriod.Monthly,
            active: true,
            prices: [
              {
                currency: CurrencyCode.TRY,
                amount: 0,
              },
            ],
            featureIds: [],
          },
          {
            name: "Pro Plan",
            code: "PRO",
            description: "Pro plan",
            trialDays: 7,
            billingInterval: BillingPeriod.Monthly,
            active: true,
            prices: [
              {
                currency: CurrencyCode.TRY,
                amount: 99.99,
              },
            ],
            featureIds: [],
          },
        ],
        createApiKey: true,
        apiKeyName: "Default API Key",
        createWebhook: false,
      };

      const result: AppProvisionResult = await provisionApp(provisionRequest);
      console.log("Provision sonucu:", result);
      alert(`Uygulama oluşturuldu! App ID: ${result.appId}\nAPI Key: ${result.apiKeyRaw || "Oluşturulmadı"}`);
      await loadAllApps();
    } catch (err: any) {
      setError(err.message || "Provision sırasında hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // İlk yüklemede tüm uygulamaları getir
  useEffect(() => {
    loadAllApps();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">AppsController Metodları Örneği</h1>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Butonlar */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">İşlemler</h2>
          <button
            onClick={loadAllApps}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-600 rounded-lg disabled:opacity-50"
          >
            Tüm Uygulamaları Getir
          </button>
          <button
            onClick={handleCreateApp}
            disabled={loading}
            className="w-full px-4 py-2 bg-green-600 rounded-lg disabled:opacity-50"
          >
            Yeni Uygulama Oluştur
          </button>
          <button
            onClick={handleProvision}
            disabled={loading}
            className="w-full px-4 py-2 bg-purple-600 rounded-lg disabled:opacity-50"
          >
            Provision (Uygulama Sağla)
          </button>
        </div>

        {/* Seçili Uygulama */}
        {selectedApp && (
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">Seçili Uygulama</h2>
            <div className="p-4 bg-neutral-800 rounded-lg">
              <p className="font-semibold">{selectedApp.name}</p>
              <p className="text-sm text-neutral-400">Kod: {selectedApp.code}</p>
              <p className="text-sm text-neutral-400">ID: {selectedApp.id}</p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => handleUpdateApp(selectedApp.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-yellow-600 rounded text-sm disabled:opacity-50"
                >
                  Güncelle
                </button>
                <button
                  onClick={() => loadDashboard(selectedApp.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-blue-600 rounded text-sm disabled:opacity-50"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleDeleteApp(selectedApp.id)}
                  disabled={loading}
                  className="px-3 py-1 bg-red-600 rounded text-sm disabled:opacity-50"
                >
                  Sil
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Özeti */}
      {dashboard && (
        <div className="p-4 bg-neutral-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Dashboard Özeti</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Aktif Planlar: {dashboard.plansActive}</div>
            <div>Pasif Planlar: {dashboard.plansInactive}</div>
            <div>Aktif Abonelikler: {dashboard.subscriptionsActive}</div>
            <div>Toplam Abonelikler: {dashboard.subscriptionsTotal}</div>
            <div>Son 30 Gün Gelir: {dashboard.revenueLast30d || 0} {dashboard.revenueCurrency}</div>
            <div>API Anahtarları: {dashboard.apiKeysActive}</div>
          </div>
        </div>
      )}

      {/* Uygulamalar Listesi */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Uygulamalar ({apps.length})</h2>
        <div className="space-y-2">
          {apps.map((app) => (
            <div
              key={app.id}
              className="p-4 bg-neutral-800 rounded-lg flex justify-between items-center cursor-pointer hover:bg-neutral-700"
              onClick={() => loadAppById(app.id)}
            >
              <div>
                <p className="font-semibold">{app.name}</p>
                <p className="text-sm text-neutral-400">{app.code}</p>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs ${
                  app.status === Status.Active
                    ? "bg-green-500/20 text-green-400"
                    : "bg-neutral-700 text-neutral-400"
                }`}
              >
                {app.status === Status.Active ? "Aktif" : "Pasif"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="text-center text-neutral-400">Yükleniyor...</div>
      )}
    </div>
  );
}

