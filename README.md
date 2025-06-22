<div align="center">
  <br />
  <p>
    <a href="#">
      <!-- Logo eklenebilir: <img src="images/logo.png" alt="Logo" width="100"> -->
    </a>
  </p>
  <h1 align="center"><b>Pansiyon Yönetim Sistemi</b></h1>
  <p align="center">
    Küçük ve orta ölçekli konaklama işletmeleri için modern, tam özellikli bir yönetim platformu.
    <br />
    <a href="#"><strong>Canlı Demo »</strong></a>
    ·
    <a href="https://github.com/saffetcelik/pansiyon-yonetim-sistemi/issues">Hata Bildir</a>
    ·
    <a href="https://github.com/saffetcelik/pansiyon-yonetim-sistemi/issues">Özellik İste</a>
  </p>
</div>

<p align="center">
  <img src="https://img.shields.io/github/license/saffetcelik/pansiyon-yonetim-sistemi?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/.NET-8-512BD4?style=for-the-badge&logo=dotnet" alt=".NET 8">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/PostgreSQL-14354C?style=for-the-badge&logo=postgresql" alt="PostgreSQL">
  <!-- CI/CD Badge: <img src="https://img.shields.io/github/actions/workflow/status/saffetcelik/pansiyon-yonetim-sistemi/main.yml?style=for-the-badge" alt="CI/CD"> -->
</p>

---

## 📖 Proje Hakkında

Pansiyon Yönetim Sistemi, konaklama sektöründeki işletmelerin operasyonel verimliliğini artırmak amacıyla geliştirilmiş açık kaynaklı bir web uygulamasıdır. Oda yönetiminden müşteri ilişkilerine, rezervasyon takibinden finansal raporlamaya kadar geniş bir yelpazede çözümler sunar.

Bu proje, modern teknolojileri ve en iyi yazılım geliştirme pratiklerini bir araya getirerek hem geliştiriciler için esnek bir platform hem de son kullanıcılar için sezgisel bir arayüz sağlamayı hedefler.

### ✨ Öne Çıkanlar

*   **Modern Teknoloji Yığını:** Performans ve ölçeklenebilirlik için **ASP.NET Core 8** ve **React 19**.
*   **Tam Kapsamlı Yönetim:** Odalar, rezervasyonlar, müşteriler ve faturalar için entegre modüller.
*   **Güvenli ve Yetkilendirilmiş:** JWT tabanlı kimlik doğrulama ve rol bazlı erişim kontrolü.
*   **Geliştirici Dostu:** Etkileşimli API dokümantasyonu (Swagger), temiz kod mimarisi ve kolay kurulum.
*   **Esnek ve Genişletilebilir:** İhtiyaçlara göre kolayca özelleştirilebilir ve yeni özellikler eklenebilir.

---

## 🚀 Başlarken

Projeyi yerel makinenizde kurup çalıştırmak için aşağıdaki adımları izleyin.

### 📋 Gereksinimler

*   [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
*   [Node.js (LTS)](https://nodejs.org/)
*   [PostgreSQL](https://www.postgresql.org/download/) veya [Docker](https://www.docker.com/products/docker-desktop/)

### ⚙️ Kurulum Adımları

1.  **Projeyi Klonlayın:**
    ```sh
    git clone https://github.com/saffetcelik/pansiyon-yonetim-sistemi.git
    cd pansiyon-yonetim-sistemi
    ```

2.  **Veritabanını Ayarlayın:**
    *   `backend/appsettings.Development.json` dosyasını açın.
    *   `ConnectionStrings.Default` alanını kendi PostgreSQL bağlantı bilgilerinizle güncelleyin.

3.  **Backend'i Çalıştırın:**
    <details>
      <summary>Terminal Komutları</summary>
      
      ```sh
      cd backend
      
      # Gerekli EF Core CLI aracını kurun
      dotnet tool install --global dotnet-ef
      
      # Veritabanı tablolarını oluşturun
      dotnet ef database update
      
      # API'yi başlatın
      dotnet run
      ```
    </details>
    API, `https://localhost:5001` adresinde çalışmaya başlayacaktır.

4.  **Frontend'i Çalıştırın:**
    <details>
      <summary>Terminal Komutları</summary>
      
      ```sh
      # Yeni bir terminal açın
      cd frontend
      
      # Bağımlılıkları yükleyin
      npm install
      
      # Geliştirme sunucusunu başlatın
      npm start
      ```
    </details>
    Uygulama arayüzü `http://localhost:3000` adresinde açılacaktır.

---

## 🛠️ Teknoloji Mimarisi

| Katman     | Teknoloji                                                              |
| :--------- | :--------------------------------------------------------------------- |
| **Ön Uç**    | `React 19`, `Redux Toolkit`, `React Router`, `MUI`, `Tailwind CSS`     |
| **Arka Uç**  | `ASP.NET Core 8`, `Entity Framework Core 9`, `AutoMapper`, `JWT`       |
| **Veritabanı** | `PostgreSQL`                                                         |
| **Test**     | `xUnit` (Backend), `React Testing Library` (Frontend)                  |
| **DevOps**   | `Swagger`, `Docker`, `GitHub Actions`                                |

---

## 🗺️ Yol Haritası

Gelecekte eklenmesi planlanan özellikler ve iyileştirmeler için [Proje Yol Haritası](semantic_roadmap.md) belgesine göz atın. Topluluk tarafından istenen özellikler için [Issues](https://github.com/saffetcelik/pansiyon-yonetim-sistemi/issues) sayfasını takip edebilirsiniz.

---

## 🤝 Katkıda Bulunma

Katkılarınız, bu projeyi daha iyi bir hale getirmemize yardımcı olur. Fikirlerinizi, hata bildirimlerinizi veya kod katkılarınızı bekliyoruz!

1.  Projeyi Fork'layın.
2.  Yeni bir özellik dalı oluşturun (`git checkout -b feature/AmazingFeature`).
3.  Değişikliklerinizi commit'leyin (`git commit -m 'Add some AmazingFeature'`).
4.  Dalınızı push'layın (`git push origin feature/AmazingFeature`).
5.  Bir Pull Request açın.

Detaylı bilgi için lütfen `CONTRIBUTING.md` dosyasını inceleyin. (Bu dosya henüz oluşturulmadı)

---

## 📄 Lisans

Bu proje **MIT Lisansı** ile lisanslanmıştır. Daha fazla bilgi için [LICENSE](LICENSE) dosyasına bakın.

---
