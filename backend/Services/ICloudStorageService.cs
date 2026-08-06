using PansiyonYonetimSistemi.API.DTOs;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface ICloudStorageService
    {
        Task<CloudTestResultDto> TestConnectionAsync(TestCloudConnectionDto dto);
        Task UploadBackupAsync(string filePath, string fileName, BackupSettingsDto settings);
        Task PruneCloudBackupsAsync(BackupSettingsDto settings);
    }
}
