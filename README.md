# 🏨 Pansiyon Yönetim Sistemi

Modern web teknolojileri kullanılarak geliştirilen, küçük / orta ölçekli konaklama işletmelerinin oda, rezervasyon, müşteri ve finans süreçlerini tek bir platformdan yönetmesini sağlayan **tam özellikli** bir açık-kaynak projedir.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![.NET](https://img.shields.io/badge/.NET-8.0-purple)
![React](https://img.shields.io/badge/React-19-blue)

---

## İçindekiler

- [Canlı Demo](#canlı-demo)
- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Klasör Yapısı](#klasör-yapısı)
- [Kurulum](#kurulum)
  - [Arka Uç](#arka-uc-backend)
  - [Ön Uç](#ön-uc-frontend)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Veritabanı ve Göçler](#veritabanı-ve-göçler)
- [API Dokümantasyonu](#api-dokümantasyonu)
- [Testler](#testler)
- [Dağıtım](#dağıtım)
- [Katkıda Bulunanlar](#katkıda-bulunanlar)
- [Lisans](#lisans)

---

## Canlı Demo

> Henüz canlı demo yayında değil. Uygulamayı yerel ortamınızda birkaç adımda çalıştırabilirsiniz; detaylar [Kurulum](#kurulum) bölümünde.

---

## Özellikler

✅ Oda / Yatak envanter yönetimi  
✅ Rezervasyon ve check-in / check-out akışı  
✅ Müşteri profili & kimlik doğrulama  
✅ Fiyatlandırma, indirim ve faturalandırma  
✅ Çoklu para birimi ve vergi desteği  
✅ Rol tabanlı yetkilendirme (Admin, Resepsiyon, Muhasebe)  
✅ JWT tabanlı API güvenliği  
✅ Swagger (OpenAPI) ile etkileşimli dokümantasyon  
✅ Duyarlı (responsive) ve PWA uyumlu kullanıcı arayüzü  
✅ CI/CD örnek **GitHub Actions** şablonu  

---

## Mimari

```
┌─────────────────────────┐        HTTP / JSON        ┌─────────────────────────┐
│      React 19 UI        │  <──────────────────────> │  ASP.NET Core 8 API     │
│   (Redux + MUI + TW)    │                           │  (EF Core + PostgreSQL) │
└─────────────────────────┘                           └────────────┬────────────┘
                                                                     │
                                                                Database
```

---

## Teknoloji Yığını

| Katman   | Teknoloji                                    |
|----------|----------------------------------------------|
| Ön Uç    | React 19, Redux Toolkit, React-Router, MUI, Tailwind CSS |
| Arka Uç  | ASP.NET Core 8, Entity Framework Core 9, AutoMapper |
| Veritabanı | PostgreSQL (Npgsql)                         |
| Diğer    | Swagger / Swashbuckle, JWT, Docker (opsiyonel) |

---

## Klasör Yapısı

```
📦 pansiyon-yonetim-sistemi
 ├── backend/                # ASP.NET Core API
 │   ├── Controllers/
 │   ├── DTOs/
 │   ├── Models/
 │   ├── Services/
 │   └── Program.cs
 ├── frontend/               # React istemcisi
 │   ├── src/
 │   ├── public/
 │   └── package.json
 ├── semantic_roadmap.md     # Planlanan özellikler
 └── README.md               # (bu dosya)
```

---

## Kurulum

Projeyi hem **Windows** hem de **Unix** sistemlerinde çalıştırabilirsiniz. Aşağıdaki adımlar örnek bir yerel kurulum senaryosunu gösterir.

### Gereksinimler

- .NET 8 SDK  (https://dotnet.microsoft.com/)  
- Node.js >= 18  
- PostgreSQL 15+

> İsteğe bağlı: `docker` & `docker-compose` kullanarak veritabanı ve API’yi konteyner içerisinde çalıştırabilirsiniz.

### Arka Uç (Backend)

```bash
# kök dizinde
cd backend
# paketleri derle ve restore et
 dotnet restore
 dotnet build

# development konfigürasyonuyla çalıştır
 dotnet run --launch-profile "PansiyonYonetimSistemi.API"
```

API varsayılan olarak `https://localhost:5001` ve `http://localhost:5000` adreslerinde ayağa kalkar.

### Ön Uç (Frontend)

```bash
cd frontend
npm install   # ya da pnpm / yarn
npm start
```

Uygulama `http://localhost:3000` üzerinde açılır ve API isteklerini otomatik olarak 5000 portuna proxy’ler.

---

## Ortam Değişkenleri

`frontend/.env` ve `backend/appsettings*.json` dosyaları üzerinden konfigürasyon yapabilirsiniz.

| Adı | Örnek Değer | Açıklama |
|-----|-------------|----------|
| `REACT_APP_API_BASE_URL` | `http://localhost:5000` | Ön uçtan API’ya giden isteklerin temel adresi |
| `ConnectionStrings:Default` | `Host=localhost;Port=5432;Database=pansiyon;Username=postgres;Password=secret` | Postgres bağlantı dizesi |
| `Jwt:Key` | `super_secret_key` | JWT imzalama anahtarı |

---

## Veritabanı ve Göçler

```bash
# Yeni migration oluştur
cd backend
 dotnet ef migrations add <MigrationName> -s PansiyonYonetimSistemi.API.csproj

# Veritabanını güncelle
 dotnet ef database update
```

> `dotnet-ef` global tool yoksa `dotnet tool install --global dotnet-ef` ile kurabilirsiniz.

---

## API Dokümantasyonu

API çalıştığında `https://localhost:5001/swagger` adresinden **Swagger UI**’a erişebilirsiniz.

---

## Testler

- Frontend için `npm test`  
- Backend için `dotnet test` (test projesi eklemeniz gerekir)

---

## Dağıtım

### Docker (Önerilen)

```bash
docker compose up --build -d
```

### Geleneksel Sunucu

1. Backend: `dotnet publish -c Release` çıktısını sunucuya kopyalayın.  
2. Frontend: `npm run build` çıktısını statik dosya sunucunuza (NGINX vb.) taşıyın.

---

## Katkıda Bulunanlar

Pull Request’ler memnuniyetle karşılanır! Lütfen önce bir *issue* açın, büyük yapısal değişiklikler için tartışma başlatın.

1. Fork → Clone → Branch → Commit → PR  
2. Kodlama standartlarına ve mevcut proje mimarisine uyun.  
3. PR açıklamalarında **neden** ve **nasıl** sorularına cevap verin.

---

## Lisans

Bu proje MIT Lisansı ile lisanslanmıştır. Ayrıntılar için `LICENSE` dosyasına bakabilirsiniz.
