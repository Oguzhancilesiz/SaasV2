# API Server Başlatma Kılavuzu

## API Server'ı Başlatma

1. **Terminal'de API projesine gidin:**
   ```bash
   cd SaasV2.API
   ```

2. **API server'ı başlatın:**
   ```bash
   dotnet run
   ```
   
   Veya belirli bir profil ile:
   ```bash
   dotnet run --launch-profile http
   ```

3. **API server başarıyla başladığında şu mesajı görmelisiniz:**
   ```
   Now listening on: http://localhost:5019
   ```

## Test Endpoint'leri

API server çalıştığında aşağıdaki endpoint'leri test edebilirsiniz:

### 1. Health Check (Basit Test)
```
GET http://localhost:5019/api/auth/health
```
Bu endpoint herhangi bir authentication gerektirmez ve API server'ın çalışıp çalışmadığını kontrol eder.

**Beklenen Response:**
```json
{
  "status": "ok",
  "message": "API is running",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. Login Endpoint
```
POST http://localhost:5019/api/auth/login
Content-Type: application/json

{
  "userName": "admin",
  "password": "your-password",
  "rememberMe": false
}
```

### 3. Me Endpoint (Authenticated)
```
GET http://localhost:5019/api/auth/me
```
Bu endpoint bir cookie (authentication) gerektirir.

## Sorun Giderme

### API server başlamıyorsa:

1. **Database bağlantısını kontrol edin:**
   - `appsettings.json` dosyasındaki connection string'i kontrol edin
   - SQL Server'ın çalıştığından emin olun

2. **Port'un kullanılmadığından emin olun:**
   ```bash
   netstat -ano | findstr :5019
   ```
   Eğer port kullanılıyorsa, başka bir process'i durdurun veya `launchSettings.json`'da portu değiştirin.

3. **Build hatalarını kontrol edin:**
   ```bash
   dotnet build
   ```

4. **API server loglarını kontrol edin:**
   - Terminal'de API server'ın çıktısını kontrol edin
   - Hata mesajlarını okuyun

### Route'lar çalışmıyorsa:

1. **Controller'ların doğru namespace'de olduğundan emin olun:**
   - Tüm controller'lar `SaasV2.API.Controllers` namespace'inde olmalı

2. **`[ApiController]` ve `[Route]` attribute'larını kontrol edin:**
   - Her controller'da `[ApiController]` olmalı
   - Her controller'da `[Route("api/...")]` olmalı

3. **API server'ı yeniden başlatın:**
   - Değişikliklerin uygulanması için API server'ı durdurup yeniden başlatın

## Next.js Frontend'den Test

Frontend'den API'ye erişim için:

1. **API Base URL'i kontrol edin:**
   - `.env.local` dosyasında `NEXT_PUBLIC_API_BASE_URL=http://localhost:5019` olmalı
   - Veya `saas-admin/src/lib/api.ts` dosyasındaki default değer kullanılır

2. **Browser Console'da test edin:**
   - Developer Tools → Console
   - Login denediğinizde `[API] Request: POST http://localhost:5019/api/auth/login` mesajını görmelisiniz

3. **Network sekmesinde kontrol edin:**
   - Developer Tools → Network
   - Login isteğini bulun ve response'u kontrol edin
