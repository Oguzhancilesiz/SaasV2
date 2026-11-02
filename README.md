# SaasV2

Birden fazla SaaS uygulamasını tek yerden yönetmek için abonelik ve faturalama altyapısı: planlar, özellikler, fiyatlandırma, API anahtarları, kullanım ölçümü ve webhook'lar. Yanında Next.js admin paneli ve entegrasyon için bir demo istemci var.

[SaasTool](https://github.com/Oguzhancilesiz/SaasTool)'un yeniden tasarlanmış ikinci sürümüdür.

## Özellikler

- **Uygulama ve plan yönetimi:** uygulamalar, planlar, plan fiyatları, plan–özellik eşleştirmeleri
- **Abonelikler ve faturalar**
- **API anahtarları:** uygulama başına anahtar üretimi ve doğrulama
- **Kullanım ölçümü:** kullanım kayıtlarıyla metered billing
- **Webhook'lar:** endpoint tanımları, teslimat kayıtları, Outbox deseniyle güvenilir gönderim
- **Kimlik:** kullanıcılar, roller, rol/kullanıcı claim'leri, harici giriş kayıtları
- **Denetim:** aktivite logları, dashboard metrikleri

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| API | ASP.NET Core Web API (.NET 9), EF Core, SQL Server, Identity, Mapster |
| Admin paneli (`saas-admin/`) | Next.js, React, Recharts, next-themes |
| Demo istemci (`demo-app/`) | React |

## Mimari

```
SaasV2.Entity → SaasV2.Mapping → SaasV2.DAL → SaasV2.Services → SaasV2.API
                     SaasV2.DTOs, SaasV2.Core (ortak)
```

## Çalıştırma

Gereksinimler: .NET 9 SDK, Node.js 18+, SQL Server.

```bash
git clone https://github.com/Oguzhancilesiz/SaasV2.git
cd SaasV2
dotnet user-secrets --project SaasV2.API set "Smtp:Password" "<smtp-sifresi>"
.\start-dev.ps1        # API (http://localhost:5019) + admin paneli (http://localhost:3000)
```

Ayrıntılar için [DEV_SETUP.md](DEV_SETUP.md).
