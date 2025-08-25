cmd /c "chcp 65001 >nul 2>&1"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Ana mesajlar
Write-Host "Pansiyon Yönetim Sistemi Başlatılıyor..." -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

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

Write-Host "Backend başlatılıyor..." -ForegroundColor Cyan

# Backend başlat
$backendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location -Path $path
    $env:DOTNET_SYSTEM_GLOBALIZATION_INVARIANT = "false"
    dotnet run --urls=http://0.0.0.0:5297
} -ArgumentList $backendPath

Write-Host "Frontend başlatılıyor..." -ForegroundColor Yellow

# Frontend başlat
$frontendJob = Start-Job -ScriptBlock {
    param($path)
    Set-Location -Path $path
    $env:PORT = "3000"
    $env:BROWSER = "none"
    npm start
} -ArgumentList $frontendPath

# Basit port kontrolü
function Test-Port($port) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $connect = $tcpClient.BeginConnect("127.0.0.1", $port, $null, $null)
        $wait = $connect.AsyncWaitHandle.WaitOne(500, $false)
        if ($wait) {
            $tcpClient.EndConnect($connect)
            $tcpClient.Close()
            return $true
        }
        $tcpClient.Close()
        return $false
    } catch {
        return $false
    }
}

Write-Host "Servisler bekleniyor..." -ForegroundColor Magenta

# Frontend portu hazır olana kadar bekle
while (-not (Test-Port 3000)) {
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline -ForegroundColor Gray
}

Write-Host ""
Write-Host "Frontend hazır! Tarayıcı açılıyor..." -ForegroundColor Green
Start-Process "http://localhost:3000"


Write-Host ""
Write-Host "Pansiyon Yönetim Sistemi çalışıyor:" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "Backend API: http://localhost:5297/swagger" -ForegroundColor Cyan
Write-Host ""
Write-Host "Durdurmak için Ctrl+C tuşuna basın." -ForegroundColor Magenta
Write-Host "===================================" -ForegroundColor DarkGray

# Ana döngü - sadece logları göster
try {
    while ($true) {
        # Backend logları
        $backendOutput = Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
        if ($backendOutput) {
            $backendOutput | ForEach-Object {
                if ($_.ToString().Trim()) { Write-Host "[API] $_" -ForegroundColor Cyan }
            }
        }

        # Frontend logları
        $frontendOutput = Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        if ($frontendOutput) {
            $frontendOutput | ForEach-Object {
                if ($_.ToString().Trim()) { Write-Host "[WEB] $_" -ForegroundColor Yellow }
            }
        }

        Start-Sleep -Milliseconds 300
    }
}
finally {
    Write-Host "Servisler durduruluyor..." -ForegroundColor Yellow
    Get-Job | Stop-Job -ErrorAction SilentlyContinue
    Get-Job | Remove-Job -Force -ErrorAction SilentlyContinue
    Write-Host "Pansiyon Yönetim Sistemi durduruldu." -ForegroundColor Red
}
