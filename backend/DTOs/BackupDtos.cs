namespace PansiyonYonetimSistemi.API.DTOs
{
    public class BackupInfoDto
    {
        public string FileName { get; set; } = string.Empty;
        public long FileSizeBytes { get; set; }
        public string FileSizeFormatted { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string DownloadUrl { get; set; } = string.Empty;
        public bool IsAutoBackup { get; set; }
    }

    public class BackupSettingsDto
    {
        public bool AutoBackupEnabled { get; set; } = true;
        public int BackupIntervalHours { get; set; } = 24; // 24 = günlük (Geriye dönük uyumluluk için tutulabilir)
        public string BackupTimeOfDay { get; set; } = "03:00"; // HH:mm formatında çalışma saati
        public int MaxLocalBackupCount { get; set; } = 5;  // Varsayılan max 5 yedek

        // Bulut ayarları
        public bool CloudBackupEnabled { get; set; } = false;
        public int MaxCloudBackupCount { get; set; } = 5;  // Varsayılan bulut max 5 yedek

        // Google Drive
        public bool GoogleDriveEnabled { get; set; } = false;
        public string GoogleDriveClientId { get; set; } = string.Empty;
        public string GoogleDriveClientSecret { get; set; } = string.Empty;
        public string GoogleDriveRefreshToken { get; set; } = string.Empty;

        // Yandex Disk
        public bool YandexDiskEnabled { get; set; } = false;
        public string YandexDiskApiKey { get; set; } = string.Empty;

        // OneDrive
        public bool OneDriveEnabled { get; set; } = false;
        public string OneDriveApiKey { get; set; } = string.Empty;
    }

    public class TestCloudConnectionDto
    {
        public string Provider { get; set; } = "GoogleDrive";
        public string ClientId { get; set; } = string.Empty;
        public string ClientSecret { get; set; } = string.Empty;
        public string ApiKeyToken { get; set; } = string.Empty;
    }

    public class CloudTestResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
