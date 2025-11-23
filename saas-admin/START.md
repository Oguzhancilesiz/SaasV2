# 🚀 Başlatma Kılavuzu

## Hızlı Başlatma

### Yöntem 1: Otomatik (Önerilen)

```bash
cd saas-admin
npm run dev:all
```

Bu komut hem API hem de Next.js'i aynı anda başlatır.

### Yöntem 2: Temiz Başlatma

Eğer önceki process'ler hala çalışıyorsa:

```bash
cd saas-admin
npm run dev:all:clean
```

Bu komut:
- Önce çalışan process'leri durdurur
- Lock dosyalarını temizler
- Sonra her şeyi başlatır

### Yöntem 3: Manuel (İki Terminal)

**Terminal 1 (API):**
```bash
cd SaasV2.API
dotnet run
```

**Terminal 2 (Next.js):**
```bash
cd saas-admin
npm run dev
```

## ⚠️ Sorun Giderme

### "Dosya kilitli" Hatası

API zaten çalışıyorsa:
```bash
# PowerShell'de
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*"} | Stop-Process -Force
```

### "Lock file" Hatası

Next.js lock dosyası varsa:
```bash
cd saas-admin
Remove-Item -Path ".next\dev\lock" -Force
```

### Port Kullanımda

Eğer port 3000 veya 5019 kullanımda:
- Port 3000: Next.js başka bir port kullanır (3001, 3002, vb.)
- Port 5019: API'yi durdurun ve yeniden başlatın

## 📝 Notlar

- API: `http://localhost:5019`
- Admin Panel: `http://localhost:3000` (veya belirtilen port)
- Demo App için API'nin çalışıyor olması gerekir

