# Demo App - Hızlı Başlangıç

## 🚀 Hızlı Kurulum (3 Adım)

### 1. API Key'i Alın

API'yi başlatın ve console'dan API Key'i kopyalayın:

```bash
cd C:\Projects\SaasV2\SaasV2.API
dotnet run
```

Console'da şunu göreceksiniz:
```
========================================
DEMO APP API KEY (Demo App için kullanın):
App ID: 455234cf-f7bc-4c83-93ad-6f4da5d1f803
App Code: DEMO_APP
API Key: sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
========================================
```

**API Key'i kopyalayın!** (Format: `sk_live_xxxxx_xxxxx`)

### 2. Demo App'i Yapılandırın

`demo-app` klasöründe `.env` dosyası oluşturun:

```env
VITE_API_BASE_URL=http://localhost:5019/api
VITE_API_KEY=sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
VITE_APP_ID=455234cf-f7bc-4c83-93ad-6f4da5d1f803
```

**Not:** `VITE_API_KEY` değerini yukarıda kopyaladığınız API Key ile değiştirin!

### 3. Demo App'i Başlatın

```bash
cd demo-app
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacaktır! 🎉

## ✅ Test Edin

1. **Subscriptions Getir** - Subscription'ları listeler
2. **Usage Records Getir** - Kullanım kayıtlarını listeler
3. **Usage Record Oluştur** - Yeni kullanım kaydı oluşturur
4. **App User Registrations** - Kullanıcı kayıtlarını listeler

## 📝 Notlar

- **App ID**: `455234cf-f7bc-4c83-93ad-6f4da5d1f803` (sabit, değiştirmeyin)
- **API Base URL**: `http://localhost:5019/api` (development)
- API çalışmıyorsa önce API'yi başlatın!

## 🆘 Sorun mu var?

- API Key çalışmıyorsa: API'yi başlatıp console'dan API Key'i tekrar kopyalayın
- CORS hatası alıyorsanız: API'nin çalıştığından emin olun
- Detaylı bilgi için `SETUP.md` dosyasına bakın
