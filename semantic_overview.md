# Pansiyon Yönetim Sistemi - Semantik Proje Özeti ve Yol Haritası

## 1. Proje Amacı ve Genel Tanım

Pansiyon Yönetim Sistemi, küçük ve orta ölçekli konaklama işletmelerinin oda, müşteri, rezervasyon, satış, finans ve stok süreçlerini dijitalleştirmek ve kolaylaştırmak için geliştirilmiş modern bir web uygulamasıdır. Hem geliştiriciler hem de son kullanıcılar için esnek ve sezgisel bir platform sunar.

## 2. Temel Mimari ve Katmanlar

- **Backend:** ASP.NET Core 8, Entity Framework Core 9, AutoMapper, JWT, PostgreSQL
- **Frontend:** React 19, Redux Toolkit, React Router, MUI, Tailwind CSS
- **Test:** xUnit (Backend), React Testing Library (Frontend)
- **DevOps:** Swagger, Docker, GitHub Actions

### Backend Ana Yapı
- `Controllers/`: Oda, rezervasyon, müşteri, ürün, satış, ödeme, rapor ve kimlik doğrulama API uç noktaları
- `Models/`: Room, Reservation, Customer, Sale, Payment, Product, User, Expense, Log, StockTransaction
- `Services/`: İş mantığı ve yardımcı servisler (ör. raporlama, JWT, stok, finans)
- `DTOs/`: Veri transfer nesneleri
- `Migrations/`: EF Core veritabanı şeması ve migration yönetimi
- `Data/`: DbContext, MappingProfile, SeedData

### Frontend Ana Yapı
- `src/pages/`: Dashboard, Reservations, Customers, Products, Sales, Reports, Debug
- `src/components/`: RoomPanel, ReservationList, CustomerList, ProductList, Modals, vb.
- `src/store/`: Redux durum yönetimi

## 3. Temel Özellikler

- Oda yönetimi (ekleme, düzenleme, durum takibi, fiyatlandırma, özellikler)
- Rezervasyon modülü (oluşturma, güncelleme, iptal, check-in/out, takvim)
- Müşteri yönetimi (kayıt, güncelleme, arama, geçmiş rezervasyonlar)
- Satış ve ürün yönetimi (ekstra satış, stok takibi, indirim, notlar)
- Finansal raporlama (gelir-gider, ödeme yöntemleri, kasa bakiyesi, trend)
- Fatura ve ödeme takibi (fatura, ödeme türleri, durum takibi)
- Kullanıcı ve rol yönetimi (admin, yönetici, çalışan, JWT tabanlı kimlik doğrulama)

## 4. Kullanıcı Rolleri

- **Admin:** Tüm sistem ayarlarına ve verilere tam erişim
- **Yönetici:** Oda, rezervasyon, müşteri, satış ve rapor yönetimi
- **Çalışan:** Sadece kendi görevleriyle ilgili modüllere erişim

## 5. Kurulum ve Çalıştırma (Özet)

1. PostgreSQL kurulumu ve bağlantı ayarlarının yapılması
2. Backend: `dotnet restore`, `dotnet ef database update`, `dotnet run`
3. Frontend: `npm install`, `npm start`
4. Giriş: Varsayılan yönetici hesabı veya ilk kullanıcı kaydı

## 6. Yapılan Temel İşlemler ve Adımlar

- Proje iskeleti oluşturuldu (backend ve frontend dizinleri)
- Entity modelleri ve ilişkiler tanımlandı (Room, Reservation, Customer, Sale, vb.)
- DbContext ve migration'lar ile veritabanı şeması oluşturuldu
- SeedData ile örnek kullanıcı, oda, ürün ve diğer veriler eklendi
- Temel API uç noktaları ve servisler geliştirildi
- JWT tabanlı kimlik doğrulama ve rol bazlı yetkilendirme eklendi
- Frontend'de temel sayfalar ve bileşenler oluşturuldu
- Raporlama, finans, stok ve ödeme sistemleri entegre edildi
- Modern ve mobil uyumlu arayüz geliştirildi
- Swagger/OpenAPI ile API dokümantasyonu sağlandı
- Docker ve GitHub Actions ile CI/CD altyapısı hazırlandı

## 7. Migration ve Seed Süreci

- Migration dosyaları ile veritabanı şeması sürekli güncellendi
- SeedData ile test ve demo verileri eklendi (kullanıcı, oda, ürün, vb.)
- Gerçek ortamda müşteri ve rezervasyon verileri manuel ekleniyor

## 8. Yol Haritası ve Gelecek Adımlar

- [semantic_roadmap.md](semantic_roadmap.md) dosyasına bakınız
- Topluluk talepleri ve yeni özellikler için Issues sayfası takip edilmeli
- Yeni eklenen veya değiştirilen her önemli özellik bu dosyaya özet olarak eklenmeli

---

> **Not:** Bu dosya, projenin semantik yapısını ve gelişim adımlarını özetler. Yeni değişiklikler ve önemli güncellemeler burada tutulmalıdır.
