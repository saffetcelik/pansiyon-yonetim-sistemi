cmd /c "chcp 65001 >nul 2>&1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Production mode için mesajlar
Write-Host "Pansiyon Yönetim Sistemi (Production Mode) Başlatılıyor..." -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Proje yolları
$rootPath = $PSScriptRoot
$backendPath = Join-Path -Path $rootPath -ChildPath "backend"
$frontendPath = Join-Path -Path $rootPath -ChildPath "frontend"

# Yol kontrolü
if (-not (Test-Path $backendPath) -or -not (Test-Path $frontendPath)) {
    Write-Host "HATA: Proje yolları bulunamadı!" -ForegroundColor Red
    exit 1
}

# Önceki işleri temizle
Get-Job | Stop-Job -ErrorAction SilentlyContinue
Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue

Write-Host "Backend (Production Mode) başlatılıyor..." -ForegroundColor Cyan

# Backend başlat - Production mode
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location -Path $path
    $env:DOTNET_SYSTEM_GLOBALIZATION_INVARIANT = "false"
    $env:ASPNETCORE_ENVIRONMENT = "Production"
    dotnet run --urls=http://0.0.0.0:5297
} -ArgumentList $backendPath

Write-Host "Frontend (Production Mode) başlatılıyor..." -ForegroundColor Yellow

# Frontend başlat - Production mode
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location -Path $path
    $env:PORT = "3000"
    $env:BROWSER = "none"
    $env:NODE_ENV = "production"
    npm run start:prod
} -ArgumentList $frontendPath

# Port kontrolü
function Test-Port($port) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("127.0.0.1", $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(500, $false)
        if ($wait) {
            $tcpClient.Close()
            return $true
        }
        $tcpClient.Close()
        return $false
    } catch {
        return $false
    }
}

# Servislerin başlamasını bekle
Write-Host "Servisler başlatılıyor, lütfen bekleyin..." -ForegroundColor Yellow

$backendReady = $false
$frontendReady = $false
$attempts = 0
$maxAttempts = 30

while ((-not $backendReady -or -not $frontendReady) -and $attempts -lt $maxAttempts) {
    Start-Sleep -Seconds 2
    $attempts++
    
    if (-not $backendReady) {
        $backendReady = Test-Port 5297
        if ($backendReady) {
            Write-Host "✓ Backend hazır (Port 5297)" -ForegroundColor Green
        }
    }
    
    if (-not $frontendReady) {
        $frontendReady = Test-Port 3000
        if ($frontendReady) {
            Write-Host "✓ Frontend hazır (Port 3000)" -ForegroundColor Green
        }
    }
    
    if ($attempts % 5 -eq 0) {
        Write-Host "Bekleniyor... ($attempts/$maxAttempts)" -ForegroundColor Yellow
    }
}

if ($backendReady -and $frontendReady) {
    Write-Host "`n🎉 Sistem başarıyla başlatıldı!" -ForegroundColor Green
    Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔧 Backend API: http://localhost:5297" -ForegroundColor Cyan
    Write-Host "🌍 Domain: https://admin.gunespansion.com.tr" -ForegroundColor Magenta
    Write-Host "`nNOT: Production modunda çalışıyor - Domain üzerinden erişim için optimize edildi" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Sistem tam olarak başlatılamadı!" -ForegroundColor Red
    if (-not $backendReady) { Write-Host "- Backend başlatılamadı" -ForegroundColor Red }
    if (-not $frontendReady) { Write-Host "- Frontend başlatılamadı" -ForegroundColor Red }
}

Write-Host "`nÇıkmak için herhangi bir tuşa basın..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Temizlik
Write-Host "`nServisler durduruluyor..." -ForegroundColor Yellow
Stop-Job $backendJob -ErrorAction SilentlyContinue
Stop-Job $frontendJob -ErrorAction SilentlyContinue
Remove-Job $backendJob -Force -ErrorAction SilentlyContinue
Remove-Job $frontendJob -Force -ErrorAction SilentlyContinue

Write-Host "Temizlik tamamlandı." -ForegroundColor Green
