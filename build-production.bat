@echo off
chcp 65001 >nul
echo Production Build için Frontend Derlemesi Başlatılıyor...
echo =====================================================

cd /d "%~dp0frontend"

echo NODE_ENV production olarak ayarlanıyor...
set NODE_ENV=production
set REACT_APP_API_URL=https://admin.gunespansiyon.com.tr/api
set REACT_APP_ENVIRONMENT=production
set GENERATE_SOURCEMAP=false

echo Frontend production build başlatılıyor...
call npm run build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Production build başarıyla tamamlandı!
    echo 📁 Build dosyaları: %~dp0frontend\build\
    echo 🌍 API URL: https://admin.gunespansiyon.com.tr/api
    echo.
    echo Build dosyalarını Cloudflare'e upload edebilirsiniz.
) else (
    echo.
    echo ❌ Build işlemi başarısız!
    exit /b 1
)

pause
