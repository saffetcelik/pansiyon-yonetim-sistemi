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
                        var now = DateTime.Now;
                        var scheduledTime = TimeSpan.TryParse(settings.BackupTimeOfDay, out var ts) ? ts : TimeSpan.FromHours(3); // Varsayılan 03:00

                        // Eğer saat ve dakika eşleşiyorsa (veya az geçmişse) ve bugün henüz yedek alınmadıysa:
                        if (now.TimeOfDay >= scheduledTime && now.TimeOfDay < scheduledTime.Add(TimeSpan.FromMinutes(5)) && _lastBackupTime.Date != now.Date)
                        {
                            _logger.LogInformation($"[BackupScheduler] Zamanlanmış otomatik yedekleme başlatılıyor... Saat: {settings.BackupTimeOfDay}");
                            var backupInfo = await backupService.CreateBackupAsync(isAutoBackup: true);
                            _lastBackupTime = now;
                            _logger.LogInformation($"[BackupScheduler] Yerel yedek oluşturuldu: {backupInfo.FileName}");

                            // Bulut yedekleme aktifse yükle
                            if (settings.CloudBackupEnabled && !string.IsNullOrWhiteSpace(settings.CloudApiKeyToken))
                            {
                                var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
                                var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
                                var backupDir = config["BackupSettings:DirectoryPath"] ?? Path.Combine(env.ContentRootPath, "App_Data", "Backups");
                                var filePath = Path.Combine(backupDir, backupInfo.FileName);
                                
                                await cloudService.UploadBackupAsync(filePath, backupInfo.FileName, settings);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[BackupScheduler] Otomatik yedekleme döngüsünde hata oluştu.");
                }

                // Her 1 dakikada bir kontrol et (saati kaçırmamak için)
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
