namespace PansiyonYonetimSistemi.API.Services
{
    public class BackupSchedulerHostedService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BackupSchedulerHostedService> _logger;
        private DateTime _lastBackupTime = DateTime.MinValue;

        public BackupSchedulerHostedService(IServiceProvider serviceProvider, ILogger<BackupSchedulerHostedService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("[BackupScheduler] Otomatik yedekleme servisi başlatıldı.");

            // Uygulama açılışından 2 dakika sonra ilk kontrolü yap
            await Task.Delay(TimeSpan.FromMinutes(2), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var backupService = scope.ServiceProvider.GetRequiredService<IDatabaseBackupService>();
                    var cloudService = scope.ServiceProvider.GetRequiredService<ICloudStorageService>();

                    var settings = await backupService.GetSettingsAsync();

                    if (settings.AutoBackupEnabled)
                    {
                        var interval = TimeSpan.FromHours(Math.Max(1, settings.BackupIntervalHours));
                        var timeSinceLastBackup = DateTime.Now - _lastBackupTime;

                        if (_lastBackupTime == DateTime.MinValue || timeSinceLastBackup >= interval)
                        {
                            _logger.LogInformation("[BackupScheduler] Zamanlanmış otomatik yedekleme başlatılıyor...");
                            var backupInfo = await backupService.CreateBackupAsync(isAutoBackup: true);
                            _lastBackupTime = DateTime.Now;
                            _logger.LogInformation($"[BackupScheduler] Yerel yedek oluşturuldu: {backupInfo.FileName}");

                            // Bulut yedekleme aktifse yükle
                            if (settings.CloudBackupEnabled && !string.IsNullOrWhiteSpace(settings.CloudApiKeyToken))
                            {
                                var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
                                var filePath = Path.Combine(env.ContentRootPath, "App_Data", "Backups", backupInfo.FileName);
                                await cloudService.UploadBackupAsync(filePath, backupInfo.FileName, settings);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[BackupScheduler] Otomatik yedekleme döngüsünde hata oluştu.");
                }

                // Her 30 dakikada bir kontrol et
                await Task.Delay(TimeSpan.FromMinutes(30), stoppingToken);
            }
        }
    }
}
