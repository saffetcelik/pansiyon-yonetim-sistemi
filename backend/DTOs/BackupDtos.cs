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
        public string CloudProvider { get; set; } = "GoogleDrive"; // GoogleDrive, YandexDisk, OneDrive
        public string CloudClientId { get; set; } = string.Empty;
        public string CloudClientSecret { get; set; } = string.Empty;
        public string CloudApiKeyToken { get; set; } = string.Empty;
        public int MaxCloudBackupCount { get; set; } = 5;  // Varsayılan bulut max 5 yedek
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
