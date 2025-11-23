# 🚀 Development Setup - Her İki Projeyi Çalıştırma

Bu proje hem .NET API hem de Next.js frontend içerir. İkisini de aynı anda çalıştırmak için aşağıdaki yöntemlerden birini kullanabilirsiniz.

## 📋 Gereksinimler

1. **.NET 9.0 SDK** - [İndir](https://dotnet.microsoft.com/download)
2. **Node.js 18+** - [İndir](https://nodejs.org/)
3. **SQL Server** - Veritabanı için

## 🎯 Yöntem 1: Otomatik Script (Önerilen)

### Windows (CMD)
```bash
start-dev.bat
```

### Windows (PowerShell)
```powershell
.\start-dev.ps1
```

Bu script her iki projeyi de otomatik olarak başlatır.

## 🎯 Yöntem 2: NPM Script ile

### 1. Gerekli paketi yükleyin
```bash
cd saas-admin
npm install
```

### 2. Her iki projeyi çalıştırın
```bash
npm run dev:all
```

Bu komut:
- `.NET API`'yi `http://localhost:5019` adresinde başlatır
- `Next.js`'i `http://localhost:3000` adresinde başlatır

## 🎯 Yöntem 3: İki Ayrı Terminal

### Terminal 1 - .NET API
```bash
cd SaasV2.API
dotnet run
```
API şu adreste çalışacak: `http://localhost:5019`

### Terminal 2 - Next.js
```bash
cd saas-admin
npm run dev
```
Next.js şu adreste çalışacak: `http://localhost:3000`

## ⚙️ Environment Variables

Next.js projesinin `.env.local` dosyasına ihtiyacı var:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5019
```

Eğer bu dosya yoksa, `saas-admin` klasöründe oluşturun:

```bash
# saas-admin/.env.local
echo NEXT_PUBLIC_API_BASE_URL=http://localhost:5019 > .env.local
```

## 🔍 Kontrol

Her iki proje de çalıştıktan sonra:

1. **API**: Tarayıcıda `http://localhost:5019/api/apps` adresini açın
2. **Frontend**: Tarayıcıda `http://localhost:3000` adresini açın

## 🛠️ Sorun Giderme

### Port kullanımda hatası
- API port'u değiştirmek için: `SaasV2.API/Properties/launchSettings.json`
- Next.js port'u değiştirmek için: `npm run dev -- -p 3001`

### API bağlantı hatası
- `.env.local` dosyasının doğru olduğundan emin olun
- API'nin çalıştığından emin olun (`http://localhost:5019`)
- CORS ayarlarını kontrol edin (`Program.cs`)

### concurrently hatası
```bash
npm install concurrently --save-dev
```

## 📝 Tek Komutla Çalıştırma

Root dizinde:
```bash
# Windows
start-dev.bat

# veya PowerShell
.\start-dev.ps1
```

## 🎨 Kullanılabilir Portlar

- **API**: `http://localhost:5019` (HTTP)
- **API**: `https://localhost:7118` (HTTPS)
- **Next.js**: `http://localhost:3000`

## ✅ Başarı Kontrolü

Her iki proje de çalışıyorsa:

1. Terminal'de iki farklı log çıktısı göreceksiniz
2. API: `.NET` logları görünecek
3. Next.js: `compiled successfully` mesajı görünecek
4. Her iki URL de tarayıcıda açılabilir olacak

## 🔄 Yeniden Başlatma

Herhangi bir değişiklik yaptıktan sonra:
- **API**: Otomatik restart (hot reload)
- **Next.js**: Otomatik restart (Fast Refresh)

Ctrl+C ile durdurabilir, tekrar `npm run dev:all` ile başlatabilirsiniz.

