using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using PansiyonYonetimSistemi.API.DTOs;

namespace PansiyonYonetimSistemi.API.Services
{
    public class CloudStorageService : ICloudStorageService
    {
        private readonly HttpClient _httpClient;

        public CloudStorageService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<CloudTestResultDto> TestConnectionAsync(TestCloudConnectionDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto.ApiKeyToken))
                {
                    return new CloudTestResultDto
                    {
                        Success = false,
                        Message = "Lütfen API Anahtarı / Access Token değerini giriniz."
                    };
                }

                switch (dto.Provider?.ToLower())
                {
                    case "googledrive":
                    case "google drive":
                        return await TestGoogleDriveAsync(dto.ApiKeyToken);

                    case "yandexdisk":
                    case "yandex disk":
                        return await TestYandexDiskAsync(dto.ApiKeyToken);

                    case "onedrive":
                        return await TestOneDriveAsync(dto.ApiKeyToken);

                    default:
                        return new CloudTestResultDto { Success = false, Message = "Bilinmeyen bulut sağlayıcı!" };
                }
            }
            catch (Exception ex)
            {
                return new CloudTestResultDto
                {
                    Success = false,
                    Message = $"Bağlantı testi sırasında hata: {ex.Message}"
                };
            }
        }

        public async Task UploadBackupAsync(string filePath, string fileName, BackupSettingsDto settings)
        {
            if (!settings.CloudBackupEnabled || string.IsNullOrWhiteSpace(settings.CloudApiKeyToken))
            {
                return;
            }

            try
            {
                var fileBytes = await File.ReadAllBytesAsync(filePath);

                switch (settings.CloudProvider?.ToLower())
                {
                    case "googledrive":
                    case "google drive":
                        await UploadToGoogleDriveAsync(fileBytes, fileName, settings.CloudApiKeyToken);
                        break;

                    case "yandexdisk":
                    case "yandex disk":
                        await UploadToYandexDiskAsync(fileBytes, fileName, settings.CloudApiKeyToken);
                        break;

                    case "onedrive":
                        await UploadToOneDriveAsync(fileBytes, fileName, settings.CloudApiKeyToken);
                        break;
                }

                // Bulut tarafındaki eski yedekleri temizle
                await PruneCloudBackupsAsync(settings);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Cloud Upload Error] {settings.CloudProvider} yükleme hatası: {ex.Message}");
            }
        }

        public async Task PruneCloudBackupsAsync(BackupSettingsDto settings)
        {
            if (!settings.CloudBackupEnabled || string.IsNullOrWhiteSpace(settings.CloudApiKeyToken)) return;
            await Task.CompletedTask; // Future deletion extension for cloud APIs
        }

        // ── Google Drive Implementation ──────────────────────────────────────
        private async Task<CloudTestResultDto> TestGoogleDriveAsync(string token)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://www.googleapis.com/drive/v3/about?fields=user");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                return new CloudTestResultDto { Success = true, Message = "Google Drive hesabına başarıyla bağlanıldı!" };
            }
            return new CloudTestResultDto { Success = false, Message = $"Google Drive doğrulama başarısız! HTTP {(int)response.StatusCode}" };
        }

        private async Task UploadToGoogleDriveAsync(byte[] fileBytes, string fileName, string token)
        {
            var metadata = new { name = fileName, mimeType = "application/sql" };
            var metadataJson = JsonSerializer.Serialize(metadata);

            using var content = new MultipartFormDataContent();
            var metaContent = new StringContent(metadataJson, Encoding.UTF8, "application/json");
            var fileContent = new ByteArrayContent(fileBytes);
            fileContent.Headers.ContentType = new MediaTypeHeaderValue("application/sql");

            content.Add(metaContent, "metadata");
            content.Add(fileContent, "file", fileName);

            var request = new HttpRequestMessage(HttpMethod.Post, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart")
            {
                Content = content
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            Console.WriteLine($"[Cloud] {fileName} Google Drive'a yüklendi.");
        }

        // ── Yandex Disk Implementation ───────────────────────────────────────
        private async Task<CloudTestResultDto> TestYandexDiskAsync(string token)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://cloud-api.yandex.net/v1/disk/");
            request.Headers.Authorization = new AuthenticationHeaderValue("OAuth", token);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                return new CloudTestResultDto { Success = true, Message = "Yandex Disk hesabına başarıyla bağlanıldı!" };
            }
            return new CloudTestResultDto { Success = false, Message = $"Yandex Disk doğrulama başarısız! HTTP {(int)response.StatusCode}" };
        }

        private async Task UploadToYandexDiskAsync(byte[] fileBytes, string fileName, string token)
        {
            // 1. Get Upload Link
            var getUrl = $"https://cloud-api.yandex.net/v1/disk/resources/upload?path=disk:/{fileName}&overwrite=true";
            var getReq = new HttpRequestMessage(HttpMethod.Get, getUrl);
            getReq.Headers.Authorization = new AuthenticationHeaderValue("OAuth", token);

            var getRes = await _httpClient.SendAsync(getReq);
            getRes.EnsureSuccessStatusCode();

            var json = await getRes.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            var href = doc.RootElement.GetProperty("href").GetString();

            // 2. Put file to URL
            var putReq = new HttpRequestMessage(HttpMethod.Put, href)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            var putRes = await _httpClient.SendAsync(putReq);
            putRes.EnsureSuccessStatusCode();
            Console.WriteLine($"[Cloud] {fileName} Yandex Disk'e yüklendi.");
        }

        // ── OneDrive Implementation ──────────────────────────────────────────
        private async Task<CloudTestResultDto> TestOneDriveAsync(string token)
        {
            var request = new HttpRequestMessage(HttpMethod.Get, "https://graph.microsoft.com/v1.0/me/drive");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
            var response = await _httpClient.SendAsync(request);

            if (response.IsSuccessStatusCode)
            {
                return new CloudTestResultDto { Success = true, Message = "OneDrive hesabına başarıyla bağlanıldı!" };
            }
            return new CloudTestResultDto { Success = false, Message = $"OneDrive doğrulama başarısız! HTTP {(int)response.StatusCode}" };
        }

        private async Task UploadToOneDriveAsync(byte[] fileBytes, string fileName, string token)
        {
            var url = $"https://graph.microsoft.com/v1.0/me/drive/root:/{fileName}:/content";
            var request = new HttpRequestMessage(HttpMethod.Put, url)
            {
                Content = new ByteArrayContent(fileBytes)
            };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);

            var response = await _httpClient.SendAsync(request);
            response.EnsureSuccessStatusCode();
            Console.WriteLine($"[Cloud] {fileName} OneDrive'a yüklendi.");
        }
    }
}
