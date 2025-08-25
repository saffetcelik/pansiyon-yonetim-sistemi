Set-Location "c:\Pansyion\pansiyon-yonetim-sistemi\backend"
Write-Host "Backend dizinine geçildi: $(Get-Location)"
Write-Host "Backend başlatılıyor..."
dotnet run --urls "http://0.0.0.0:5297"
