using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Services;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BackupController : ControllerBase
    {
        private readonly IDatabaseBackupService _backupService;
        private readonly ICloudStorageService _cloudService;
        private readonly IWebHostEnvironment _env;

        public BackupController(IDatabaseBackupService backupService, ICloudStorageService cloudService, IWebHostEnvironment env)
        {
            _backupService = backupService;
            _cloudService = cloudService;
            _env = env;
        }

        [HttpGet("list")]
        public IActionResult GetBackupsList()
        {
            try
            {
                var backups = _backupService.GetBackupsList();
                return Ok(new { data = backups });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedekler listelenirken hata oluştu.", error = ex.Message });
            }
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateBackup()
        {
            try
            {
                var backupInfo = await _backupService.CreateBackupAsync(isAutoBackup: false);
                var settings = await _backupService.GetSettingsAsync();

                // Bulut yedekleme aktifse manuel yedeği de buluta yükle
                if (settings.CloudBackupEnabled && !string.IsNullOrWhiteSpace(settings.CloudApiKeyToken))
                {
                    var filePath = Path.Combine(_env.ContentRootPath, "App_Data", "Backups", backupInfo.FileName);
                    _ = Task.Run(() => _cloudService.UploadBackupAsync(filePath, backupInfo.FileName, settings));
                }

                return Ok(new { message = "Yedek başarıyla oluşturuldu.", data = backupInfo });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedek oluşturulurken hata oluştu.", error = ex.Message });
            }
        }

        [HttpGet("download/{fileName}")]
        [AllowAnonymous] // İndirme bağlantısının doğrudan veya auth token ile çalışabilmesi için
        public IActionResult DownloadBackup(string fileName)
        {
            try
            {
                var filePath = Path.Combine(_env.ContentRootPath, "App_Data", "Backups", fileName);
                if (!System.IO.File.Exists(filePath))
                {
                    return NotFound(new { message = "Yedek dosyası bulunamadı." });
                }

                var bytes = System.IO.File.ReadAllBytes(filePath);
                return File(bytes, "application/sql", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedek indirilirken hata oluştu.", error = ex.Message });
            }
        }

        [HttpPost("restore")]
        public async Task<IActionResult> RestoreBackup([FromForm] IFormFile? file, [FromQuery] string? fileName)
        {
            try
            {
                Stream? streamToRestore = null;

                if (file != null && file.Length > 0)
                {
                    streamToRestore = file.OpenReadStream();
                }
                else if (!string.IsNullOrWhiteSpace(fileName))
                {
                    var filePath = Path.Combine(_env.ContentRootPath, "App_Data", "Backups", fileName);
                    if (!System.IO.File.Exists(filePath))
                    {
                        return NotFound(new { message = "Belirtilen yerel yedek dosyası bulunamadı." });
                    }
                    streamToRestore = System.IO.File.OpenRead(filePath);
                }

                if (streamToRestore == null)
                {
                    return BadRequest(new { message = "Lütfen bir yedek dosyası yükleyin veya yerel bir dosya seçin." });
                }

                using (streamToRestore)
                {
                    await _backupService.RestoreBackupAsync(streamToRestore);
                }

                return Ok(new { message = "Veritabanı başarıyla yedeğe geri yüklendi!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedek geri yüklenirken hata oluştu.", error = ex.Message });
            }
        }

        [HttpDelete("{fileName}")]
        public IActionResult DeleteBackup(string fileName)
        {
            try
            {
                var success = _backupService.DeleteBackup(fileName);
                if (!success)
                {
                    return NotFound(new { message = "Yedek dosyası bulunamadı." });
                }
                return Ok(new { message = "Yedek dosyası başarıyla silindi." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedek silinirken hata oluştu.", error = ex.Message });
            }
        }

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings()
        {
            try
            {
                var settings = await _backupService.GetSettingsAsync();
                return Ok(new { data = settings });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yedekleme ayarları alınırken hata oluştu.", error = ex.Message });
            }
        }

        [HttpPut("settings")]
        public async Task<IActionResult> SaveSettings([FromBody] BackupSettingsDto dto)
        {
            try
            {
                await _backupService.SaveSettingsAsync(dto);
                return Ok(new { message = "Yedekleme ve bulut ayarları başarıyla kaydedildi.", data = dto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ayarlar kaydedilirken hata oluştu.", error = ex.Message });
            }
        }

        [HttpPost("test-cloud")]
        public async Task<IActionResult> TestCloud([FromBody] TestCloudConnectionDto dto)
        {
            try
            {
                var result = await _cloudService.TestConnectionAsync(dto);
                return Ok(new { data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Bulut testi gerçekleştirilemedi.", error = ex.Message });
            }
        }
    }
}
