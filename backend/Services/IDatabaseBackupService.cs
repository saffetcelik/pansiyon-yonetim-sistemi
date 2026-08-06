using PansiyonYonetimSistemi.API.DTOs;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IDatabaseBackupService
    {
        Task<BackupInfoDto> CreateBackupAsync(bool isAutoBackup = false);
        Task<bool> RestoreBackupAsync(Stream backupStream);
        List<BackupInfoDto> GetBackupsList();
        bool DeleteBackup(string fileName);
        Task PruneOldBackupsAsync(int maxCount);
        Task<BackupSettingsDto> GetSettingsAsync();
        Task SaveSettingsAsync(BackupSettingsDto settings);
    }
}
