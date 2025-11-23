# Demo App - SaaS API Test Uygulaması

Bu uygulama, SaaS API'yi test etmek için oluşturulmuş bir React web uygulamasıdır.

## Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **API Key'i ayarlayın:**
   - API'yi başlattığınızda console'da şu şekilde bir çıktı göreceksiniz:
     ```
     ========================================
     DEMO APP API KEY (Demo App için kullanın):
     App ID: 455234cf-f7bc-4c83-93ad-6f4da5d1f803
     App Code: DEMO_APP
     API Key: sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
     ========================================
     ```
   - Bu API Key'i kopyalayın
   - `.env` dosyası oluşturun (`.env.example` dosyasını kopyalayın)
   - `VITE_API_KEY` değerini yapıştırın

3. **Uygulamayı başlatın:**
   ```bash
   npm run dev
   ```

   Uygulama `http://localhost:5173` adresinde açılacaktır.

## Kullanım

1. **API Yapılandırması:**
   - İlk açılışta API Key ve App ID'yi girmeniz istenecek
   - API Key'i console'dan kopyalayıp yapıştırın
   - App ID otomatik olarak `455234cf-f7bc-4c83-93ad-6f4da5d1f803` olarak ayarlanmıştır

2. **Test Fonksiyonları:**
   - **Subscriptions Getir**: Kullanıcının subscription'larını listeler
   - **Usage Records Getir**: Kullanım kayıtlarını listeler
   - **Usage Record Oluştur**: Yeni bir kullanım kaydı oluşturur
   - **App User Registrations**: Kullanıcı kayıtlarını listeler

## Gereksinimler

- Node.js 18+
- npm veya yarn
- Çalışan SaaS API (http://localhost:5019)

## Notlar

- API Key formatı: `prefix_hash` (örn: `sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx`)
- App ID: `455234cf-f7bc-4c83-93ad-6f4da5d1f803` (DEMO_APP)
- Tüm API istekleri `X-API-Key` ve `X-App-Id` header'ları ile gönderilir
