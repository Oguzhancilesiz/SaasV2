# AppsController API Kullanım Kılavuzu

Bu dosya, backend'deki `AppsController` metodlarını frontend'de (TypeScript/React) nasıl kullanacağınızı gösterir.

## 📁 Oluşturulan Dosyalar

1. **`src/types/app.ts`** - Tüm TypeScript tipleri ve enum'lar
2. **`src/lib/appsService.ts`** - API servis fonksiyonları
3. **`src/examples/AppServiceExample.tsx`** - Detaylı kullanım örneği
4. **`src/examples/SimpleAppExample.tsx`** - Basit kullanım örneği

## 🚀 Hızlı Başlangıç

### 1. Tipleri İçe Aktarın

```typescript
import type { AppDto, AppAddDto, AppUpdateDto } from "@/types/app";
```

### 2. Servis Fonksiyonlarını İçe Aktarın

```typescript
import {
  getAllApps,
  getAppById,
  createApp,
  updateApp,
  deleteApp,
  getAppDashboard,
  provisionApp,
} from "@/lib/appsService";
```

### 3. Kullanım Örnekleri

#### Tüm Uygulamaları Getir

```typescript
const apps = await getAllApps();
console.log(apps); // AppDto[]
```

#### ID ile Uygulama Getir

```typescript
const app = await getAppById("guid-id-buraya");
console.log(app); // AppDto
```

#### Kod ile Uygulama Getir

```typescript
const app = await getAppByCode("APP_CODE");
console.log(app); // AppDto
```

#### Yeni Uygulama Oluştur

```typescript
const newApp: AppAddDto = {
  name: "Yeni Uygulama",
  code: "NEW_APP",
  description: "Açıklama",
};

const created = await createApp(newApp);
console.log(created); // AppDto
```

#### Uygulama Güncelle

```typescript
const updateData: AppUpdateDto = {
  id: "guid-id",
  name: "Güncellenmiş Ad",
  code: "UPDATED_CODE",
  description: "Yeni açıklama",
};

await updateApp("guid-id", updateData);
```

#### Uygulama Sil

```typescript
await deleteApp("guid-id");
```

#### Dashboard Özeti Getir

```typescript
const dashboard = await getAppDashboard("guid-id");
console.log(dashboard.plansActive); // Aktif plan sayısı
console.log(dashboard.subscriptionsActive); // Aktif abonelik sayısı
```

#### Toplu Dashboard Getir

```typescript
const dashboards = await getAppDashboardsBatch(["id1", "id2", "id3"]);
console.log(dashboards); // AppDashboardSummary[]
```

#### Provision (Uygulama Sağlama)

```typescript
import { BillingPeriod, CurrencyCode } from "@/types/app";

const provisionRequest: AppProvisionRequest = {
  name: "Sağlanmış App",
  code: "PROVISIONED",
  description: "Açıklama",
  plans: [
    {
      name: "Free Plan",
      code: "FREE",
      trialDays: 14,
      billingInterval: BillingPeriod.Monthly,
      active: true,
      prices: [
        { currency: CurrencyCode.TRY, amount: 0 }
      ],
      featureIds: [],
    },
  ],
  createApiKey: true,
  apiKeyName: "Default",
  createWebhook: false,
};

const result = await provisionApp(provisionRequest);
console.log(result.appId); // Oluşturulan uygulama ID'si
console.log(result.apiKeyRaw); // API anahtarı (sadece bu seferlik!)
```

## 📝 React Component Örneği

```typescript
"use client";

import { useState, useEffect } from "react";
import { getAllApps, createApp } from "@/lib/appsService";
import type { AppDto, AppAddDto } from "@/types/app";

export default function MyAppComponent() {
  const [apps, setApps] = useState<AppDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setLoading(true);
    try {
      const data = await getAllApps();
      setApps(data);
    } catch (error) {
      console.error("Hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    try {
      const newApp: AppAddDto = {
        name: "Yeni App",
        code: "NEW_APP",
      };
      await createApp(newApp);
      await loadApps(); // Listeyi yenile
    } catch (error) {
      console.error("Hata:", error);
    }
  };

  return (
    <div>
      <button onClick={handleAdd}>Yeni Ekle</button>
      {loading ? (
        <div>Yükleniyor...</div>
      ) : (
        <div>
          {apps.map((app) => (
            <div key={app.id}>{app.name}</div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## 🎯 API Endpoint'leri

Backend'deki endpoint'ler:

- `GET /api/apps` - Tüm uygulamalar
- `GET /api/apps/{id}` - ID ile uygulama
- `GET /api/apps/by-code/{code}` - Kod ile uygulama
- `POST /api/apps` - Yeni uygulama oluştur
- `PUT /api/apps/{id}` - Uygulama güncelle
- `DELETE /api/apps/{id}` - Uygulama sil
- `GET /api/apps/{id}/dashboard` - Dashboard özeti
- `POST /api/apps/dashboard/batch` - Toplu dashboard
- `POST /api/apps/provision` - Uygulama sağlama

## ⚠️ Önemli Notlar

1. **API Base URL**: `.env` dosyanızda `NEXT_PUBLIC_API_BASE_URL` tanımlı olmalı
2. **Hata Yönetimi**: Tüm fonksiyonlar hata fırlatabilir, try-catch kullanın
3. **Type Safety**: TypeScript tipleri backend DTO'larıyla eşleşir
4. **CORS**: Backend'de CORS ayarları Next.js için yapılandırılmış olmalı

## 📚 Daha Fazla Bilgi

Detaylı örnekler için:
- `src/examples/AppServiceExample.tsx` - Tüm metodların örnekleri
- `src/examples/SimpleAppExample.tsx` - Basit kullanım örneği

