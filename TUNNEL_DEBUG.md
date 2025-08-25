# Cloudflare Tunnel Debug Rehberi

## Sorun
- Aynı bilgisayardan domain üzerinden erişim çalışıyor
- Farklı cihazlardan erişim çalışmıyor

## Teşhis Adımları

### 1. Tunnel Durumunu Kontrol Edin
```bash
cloudflared tunnel list
cloudflared tunnel info [TUNNEL-NAME]
```

### 2. Tunnel Log'larını İnceleyin
```bash
cloudflared tunnel run [TUNNEL-NAME] --loglevel debug
```

### 3. Network Bağlantısını Test Edin

**Aynı bilgisayardan:**
```bash
curl -v http://127.0.0.1:5297/api/test/health
curl -v https://admin.gunespansiyon.com.tr/api/test/health
```

**Farklı cihazdan:**
```bash
curl -v https://admin.gunespansiyon.com.tr/api/test/health
```

### 4. Firewall Kontrolleri

Windows Firewall'da 5297 portuna izin verilmiş mi:
```powershell
netsh advfirewall firewall show rule name="ASP.NET Core Web Server"
```

## Olası Çözümler

### Çözüm 1: Backend URL'ini Değiştirin
```bash
dotnet run --urls="http://0.0.0.0:5297"
```

### Çözüm 2: Cloudflare Tunnel Config
```yaml
tunnel: [TUNNEL-ID]
credentials-file: [PATH]

ingress:
  - hostname: admin.gunespansiyon.com.tr
    path: /api/*
    service: http://127.0.0.1:5297
  - hostname: admin.gunespansiyon.com.tr
    service: http://127.0.0.1:3000
  - service: http_status:404
```

### Çözüm 3: Windows Firewall Kuralı
```powershell
netsh advfirewall firewall add rule name="Pansiyon Backend" dir=in action=allow protocol=TCP localport=5297
```

## Test URL'leri
- Health Check: https://admin.gunespansiyon.com.tr/api/test/health
- Login Test: https://admin.gunespansiyon.com.tr/api/auth/login
- Frontend: https://admin.gunespansiyon.com.tr

## Debug Komutları
```powershell
# Port dinlemesi kontrolü
netstat -an | findstr :5297

# Process kontrolü  
Get-Process | Where-Object {$_.ProcessName -like "*dotnet*"}

# Cloudflared status
cloudflared tunnel info [TUNNEL-NAME]
```
