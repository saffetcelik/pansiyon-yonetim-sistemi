# Cloudflare Tunnel Yapılandırma Rehberi

## Sorun
Domain üzerinden erişirken API endpoint'leri localhost:5297'ye yönlendiriliyor ve bağlantı hatası alınıyor.

## Çözüm

### 1. Cloudflare Tunnel Yapılandırması

Cloudflare Tunnel'da aşağıdaki yönlendirmeleri yapmanız gerekiyor:

#### Frontend (React)
- **Hostname**: admin.gunespansiyon.com.tr
- **Service**: http://localhost:3000
- **Path**: / (ana path)

#### Backend API 
- **Hostname**: admin.gunespansiyon.com.tr
- **Service**: http://localhost:5297
- **Path**: /api/*

### 2. Alternative Çözümler

#### Seçenek A: Subdomain Kullanımı
- Frontend: https://admin.gunespansiyon.com.tr
- API: https://api.gunespansiyon.com.tr

#### Seçenek B: Aynı Domain Farklı Path
- Frontend: https://admin.gunespansiyon.com.tr/
- API: https://admin.gunespansiyon.com.tr/api/

### 3. Cloudflare Dashboard'da Yapılacaklar

1. **Tunnel Rules** bölümüne gidin
2. **Edit** butonuna tıklayın
3. Aşağıdaki kuralları ekleyin:

```
Rule 1:
- If: hostname is admin.gunespansiyon.com.tr AND path starts with /api
- Then: http://localhost:5297

Rule 2:
- If: hostname is admin.gunespansiyon.com.tr
- Then: http://localhost:3000
```

### 4. DNS Ayarları

Cloudflare DNS'de:
- **Type**: CNAME
- **Name**: admin
- **Target**: [your-tunnel-id].cfargotunnel.com
- **Proxy status**: Proxied (🧡)

### 5. Test Etme

Build sonrası test URL'leri:
- Frontend: https://admin.gunespansiyon.com.tr
- API Health Check: https://admin.gunespansiyon.com.tr/api/test/health

### 6. Güvenlik

Production için HTTPS zorunlu olduğundan:
- Mixed content (HTTP API + HTTPS Frontend) engellenebilir
- Tüm API çağrıları HTTPS üzerinden yapılmalı

## Troubleshooting

### Eğer API çağrıları başarısız olursa:

1. **Browser Console'da URL'leri kontrol edin**
2. **Network tab'ında hangi URL'lere istek gönderildiğini görün**
3. **Cloudflare Tunnel loglarını kontrol edin**
4. **CORS hatası alırsanız backend CORS ayarlarını kontrol edin**

### Debug İçin Console Logları

Tarayıcı console'unda şu logları göreceksiniz:
```
AuthService - Hostname: admin.gunespansiyon.com.tr Protocol: https:
AuthService: Domain üzerinden erişim tespit edildi. API URL: https://admin.gunespansiyon.com.tr/api
```

Bu loglar API URL'nin doğru belirlendiğini gösterir.
