# Demo App Kurulum Kılavuzu

## 1. API Key'i Alma

Demo app'in API'ye erişebilmesi için API Key gereklidir. API Key'i almak için:

### Yöntem 1: API Console'dan (Önerilen)

1. **API'yi başlatın:**
   ```bash
   cd C:\Projects\SaasV2\SaasV2.API
   dotnet run
   ```

2. **Console çıktısında şunu göreceksiniz:**
   ```
   ========================================
   DEMO APP API KEY (Demo App için kullanın):
   App ID: 455234cf-f7bc-4c83-93ad-6f4da5d1f803
   App Code: DEMO_APP
   API Key: sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
   ========================================
   ```

3. **API Key'i kopyalayın** (format: `sk_live_xxxxx_xxxxx`)

### Yöntem 2: Admin Panelden

1. Admin paneline giriş yapın: `http://localhost:3001/login`
2. Apps > DEMO_APP > API Keys bölümüne gidin
3. API Key'i kopyalayın

## 2. Demo App'i Yapılandırma

### Yöntem 1: Environment Variables (Önerilen)

1. `demo-app` klasöründe `.env` dosyası oluşturun:
   ```env
   VITE_API_BASE_URL=http://localhost:5019/api
   VITE_API_KEY=sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx
   VITE_APP_ID=455234cf-f7bc-4c83-93ad-6f4da5d1f803
   ```

2. API Key'i yukarıdaki değerle değiştirin

### Yöntem 2: Uygulama İçi Yapılandırma

1. Demo app'i başlatın:
   ```bash
   cd demo-app
   npm install
   npm run dev
   ```

2. Uygulama açıldığında "API Yapılandırması" formu görünecek
3. API Key'i yapıştırın ve "Yapılandırmayı Kaydet" butonuna tıklayın

## 3. Demo App'i Başlatma

```bash
cd demo-app
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılacaktır.

## 4. Test Etme

1. **Subscriptions Getir**: Kullanıcının subscription'larını listeler
2. **Usage Records Getir**: Kullanım kayıtlarını listeler
3. **Usage Record Oluştur**: Yeni bir kullanım kaydı oluşturur (App ID ve User ID gerekli)
4. **App User Registrations**: Kullanıcı kayıtlarını listeler

## Notlar

- **App ID**: `455234cf-f7bc-4c83-93ad-6f4da5d1f803` (DEMO_APP - sabit)
- **API Base URL**: `http://localhost:5019/api` (development)
- **API Key Format**: `prefix_hash` (örn: `sk_live_xxxxxxxx_xxxxxxxxxxxxxxxxxxxxxxxx`)

## Sorun Giderme

### API Key çalışmıyorsa:

1. API Key'in doğru kopyalandığından emin olun (tam format: `prefix_hash`)
2. API'nin çalıştığından emin olun (`http://localhost:5019/api/auth/health`)
3. Browser console'da hata mesajlarını kontrol edin
4. Network tab'ında API isteklerini kontrol edin

### CORS hatası alıyorsanız:

1. API'nin CORS ayarlarını kontrol edin (`Program.cs`)
2. Demo app'in port'unun CORS'ta tanımlı olduğundan emin olun
