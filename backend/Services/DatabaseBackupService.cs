using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public class DatabaseBackupService : IDatabaseBackupService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly string _backupDirectory;

        public DatabaseBackupService(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
            _backupDirectory = Path.Combine(_env.ContentRootPath, "App_Data", "Backups");
            if (!Directory.Exists(_backupDirectory))
            {
                Directory.CreateDirectory(_backupDirectory);
            }
        }

        public async Task<BackupInfoDto> CreateBackupAsync(bool isAutoBackup = false)
        {
            var timeStamp = DateTime.Now.ToString("yyyy-MM-dd_HH-mm-ss");
            var prefix = isAutoBackup ? "auto_backup" : "manual_backup";
            var fileName = $"{prefix}_{timeStamp}.sql";
            var filePath = Path.Combine(_backupDirectory, fileName);

            var sqlBuilder = new StringBuilder();
            sqlBuilder.AppendLine($"-- Pansiyon Yönetim Sistemi Veritabanı Yedeği");
            sqlBuilder.AppendLine($"-- Oluşturulma Tarihi: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sqlBuilder.AppendLine($"-- Otomatik Yedek: {(isAutoBackup ? "Evet" : "Hayır")}");
            sqlBuilder.AppendLine();
            sqlBuilder.AppendLine("BEGIN;");
            sqlBuilder.AppendLine();

            // 1. Users
            var users = await _context.Users.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Users ({users.Count} kayıt)");
            foreach (var u in users)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Users\" (\"Id\", \"Username\", \"PasswordHash\", \"Email\", \"FirstName\", \"LastName\", \"Phone\", \"Role\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\", \"LastLoginDate\") " +
                    $"VALUES ({u.Id}, {SqlString(u.Username)}, {SqlString(u.PasswordHash)}, {SqlString(u.Email)}, {SqlString(u.FirstName)}, {SqlString(u.LastName)}, {SqlString(u.Phone)}, {(int)u.Role}, {SqlBool(u.IsActive)}, {SqlDate(u.CreatedAt)}, {SqlDate(u.UpdatedAt)}, {SqlDate(u.LastLoginDate)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Username\" = EXCLUDED.\"Username\", \"PasswordHash\" = EXCLUDED.\"PasswordHash\", \"Email\" = EXCLUDED.\"Email\", \"FirstName\" = EXCLUDED.\"FirstName\", \"LastName\" = EXCLUDED.\"LastName\", \"Phone\" = EXCLUDED.\"Phone\", \"Role\" = EXCLUDED.\"Role\", \"IsActive\" = EXCLUDED.\"IsActive\";"
                );
            }
            sqlBuilder.AppendLine();

            // 2. Customers
            var customers = await _context.Customers.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Customers ({customers.Count} kayıt)");
            foreach (var c in customers)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Customers\" (\"Id\", \"FirstName\", \"LastName\", \"TCKimlikNo\", \"PassportNo\", \"Phone\", \"Email\", \"Address\", \"City\", \"Country\", \"DateOfBirth\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({c.Id}, {SqlString(c.FirstName)}, {SqlString(c.LastName)}, {SqlString(c.TCKimlikNo)}, {SqlString(c.PassportNo)}, {SqlString(c.Phone)}, {SqlString(c.Email)}, {SqlString(c.Address)}, {SqlString(c.City)}, {SqlString(c.Country)}, {SqlDate(c.DateOfBirth)}, {SqlDate(c.CreatedAt)}, {SqlDate(c.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"FirstName\" = EXCLUDED.\"FirstName\", \"LastName\" = EXCLUDED.\"LastName\", \"TCKimlikNo\" = EXCLUDED.\"TCKimlikNo\", \"PassportNo\" = EXCLUDED.\"PassportNo\", \"Phone\" = EXCLUDED.\"Phone\", \"Email\" = EXCLUDED.\"Email\", \"Address\" = EXCLUDED.\"Address\", \"City\" = EXCLUDED.\"City\", \"Country\" = EXCLUDED.\"Country\";"
                );
            }
            sqlBuilder.AppendLine();

            // 3. Rooms
            var rooms = await _context.Rooms.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Rooms ({rooms.Count} kayıt)");
            foreach (var r in rooms)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Rooms\" (\"Id\", \"RoomNumber\", \"Type\", \"Capacity\", \"PricePerNight\", \"Status\", \"Description\", \"HasWiFi\", \"HasTV\", \"HasAirConditioning\", \"HasBalcony\", \"HasMinibar\", \"HasSeaView\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({r.Id}, {SqlString(r.RoomNumber)}, {(int)r.Type}, {r.Capacity}, {SqlNum(r.PricePerNight)}, {(int)r.Status}, {SqlString(r.Description)}, {SqlBool(r.HasWiFi)}, {SqlBool(r.HasTV)}, {SqlBool(r.HasAirConditioning)}, {SqlBool(r.HasBalcony)}, {SqlBool(r.HasMinibar)}, {SqlBool(r.HasSeaView)}, {SqlDate(r.CreatedAt)}, {SqlDate(r.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"RoomNumber\" = EXCLUDED.\"RoomNumber\", \"Type\" = EXCLUDED.\"Type\", \"Capacity\" = EXCLUDED.\"Capacity\", \"PricePerNight\" = EXCLUDED.\"PricePerNight\", \"Status\" = EXCLUDED.\"Status\", \"Description\" = EXCLUDED.\"Description\";"
                );
            }
            sqlBuilder.AppendLine();

            // 4. Reservations
            var reservations = await _context.Reservations.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Reservations ({reservations.Count} kayıt)");
            foreach (var res in reservations)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Reservations\" (\"Id\", \"ReservationName\", \"ReservationGroupId\", \"CustomerId\", \"RoomId\", \"CheckInDate\", \"CheckOutDate\", \"NumberOfGuests\", \"TotalAmount\", \"PaidAmount\", \"Status\", \"Notes\", \"ActualCheckInDate\", \"ActualCheckOutDate\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({res.Id}, {SqlString(res.ReservationName)}, {SqlString(res.ReservationGroupId)}, {SqlNullable(res.CustomerId)}, {res.RoomId}, {SqlDate(res.CheckInDate)}, {SqlDate(res.CheckOutDate)}, {res.NumberOfGuests}, {SqlNum(res.TotalAmount)}, {SqlNum(res.PaidAmount)}, {(int)res.Status}, {SqlString(res.Notes)}, {SqlDate(res.ActualCheckInDate)}, {SqlDate(res.ActualCheckOutDate)}, {SqlDate(res.CreatedAt)}, {SqlDate(res.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"ReservationName\" = EXCLUDED.\"ReservationName\", \"ReservationGroupId\" = EXCLUDED.\"ReservationGroupId\", \"CustomerId\" = EXCLUDED.\"CustomerId\", \"RoomId\" = EXCLUDED.\"RoomId\", \"CheckInDate\" = EXCLUDED.\"CheckInDate\", \"CheckOutDate\" = EXCLUDED.\"CheckOutDate\", \"NumberOfGuests\" = EXCLUDED.\"NumberOfGuests\", \"TotalAmount\" = EXCLUDED.\"TotalAmount\", \"PaidAmount\" = EXCLUDED.\"PaidAmount\", \"Status\" = EXCLUDED.\"Status\", \"Notes\" = EXCLUDED.\"Notes\";"
                );
            }
            sqlBuilder.AppendLine();

            // 5. ReservationCustomers
            var resCustomers = await _context.ReservationCustomers.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: ReservationCustomers ({resCustomers.Count} kayıt)");
            foreach (var rc in resCustomers)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"ReservationCustomers\" (\"Id\", \"ReservationId\", \"CustomerId\", \"Role\", \"OrderIndex\", \"CreatedAt\") " +
                    $"VALUES ({rc.Id}, {rc.ReservationId}, {rc.CustomerId}, {SqlString(rc.Role)}, {rc.OrderIndex}, {SqlDate(rc.CreatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Role\" = EXCLUDED.\"Role\", \"OrderIndex\" = EXCLUDED.\"OrderIndex\";"
                );
            }
            sqlBuilder.AppendLine();

            // 6. Products
            var products = await _context.Products.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Products ({products.Count} kayıt)");
            foreach (var p in products)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Products\" (\"Id\", \"Name\", \"Barcode\", \"Category\", \"Price\", \"CostPrice\", \"StockQuantity\", \"MinStockLevel\", \"Unit\", \"Description\", \"IsActive\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({p.Id}, {SqlString(p.Name)}, {SqlString(p.Barcode)}, {(int)p.Category}, {SqlNum(p.Price)}, {SqlNum(p.CostPrice)}, {p.StockQuantity}, {p.MinStockLevel}, {SqlString(p.Unit)}, {SqlString(p.Description)}, {SqlBool(p.IsActive)}, {SqlDate(p.CreatedAt)}, {SqlDate(p.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Name\" = EXCLUDED.\"Name\", \"Price\" = EXCLUDED.\"Price\", \"StockQuantity\" = EXCLUDED.\"StockQuantity\";"
                );
            }
            sqlBuilder.AppendLine();

            // 7. Sales
            var sales = await _context.Sales.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Sales ({sales.Count} kayıt)");
            foreach (var s in sales)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Sales\" (\"Id\", \"SaleNumber\", \"SaleDate\", \"CustomerId\", \"ReservationId\", \"TotalAmount\", \"DiscountAmount\", \"NetAmount\", \"PaymentMethod\", \"Notes\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({s.Id}, {SqlString(s.SaleNumber)}, {SqlDate(s.SaleDate)}, {SqlNullable(s.CustomerId)}, {SqlNullable(s.ReservationId)}, {SqlNum(s.TotalAmount)}, {SqlNum(s.DiscountAmount)}, {SqlNum(s.NetAmount)}, {(int)s.PaymentMethod}, {SqlString(s.Notes)}, {SqlDate(s.CreatedAt)}, {SqlDate(s.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"SaleNumber\" = EXCLUDED.\"SaleNumber\", \"TotalAmount\" = EXCLUDED.\"TotalAmount\";"
                );
            }
            sqlBuilder.AppendLine();

            // 8. SaleItems
            var saleItems = await _context.SaleItems.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: SaleItems ({saleItems.Count} kayıt)");
            foreach (var si in saleItems)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"SaleItems\" (\"Id\", \"SaleId\", \"ProductId\", \"Quantity\", \"UnitPrice\", \"TotalPrice\") " +
                    $"VALUES ({si.Id}, {si.SaleId}, {si.ProductId}, {si.Quantity}, {SqlNum(si.UnitPrice)}, {SqlNum(si.TotalPrice)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Quantity\" = EXCLUDED.\"Quantity\", \"TotalPrice\" = EXCLUDED.\"TotalPrice\";"
                );
            }
            sqlBuilder.AppendLine();

            // 9. Expenses
            var expenses = await _context.Expenses.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Expenses ({expenses.Count} kayıt)");
            foreach (var ex in expenses)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Expenses\" (\"Id\", \"ExpenseNumber\", \"Title\", \"Description\", \"Amount\", \"ExpenseDate\", \"Category\", \"Status\", \"Vendor\", \"InvoiceNumber\", \"PaymentMethod\", \"PaymentDate\", \"DueDate\", \"Notes\", \"AttachmentPath\", \"UserId\", \"ApprovedByUserId\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({ex.Id}, {SqlString(ex.ExpenseNumber)}, {SqlString(ex.Title)}, {SqlString(ex.Description)}, {SqlNum(ex.Amount)}, {SqlDate(ex.ExpenseDate)}, {(int)ex.Category}, {(int)ex.Status}, {SqlString(ex.Vendor)}, {SqlString(ex.InvoiceNumber)}, {SqlNullable((int?)ex.PaymentMethod)}, {SqlDate(ex.PaymentDate)}, {SqlDate(ex.DueDate)}, {SqlString(ex.Notes)}, {SqlString(ex.AttachmentPath)}, {SqlNullable(ex.UserId)}, {SqlNullable(ex.ApprovedByUserId)}, {SqlDate(ex.CreatedAt)}, {SqlDate(ex.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Title\" = EXCLUDED.\"Title\", \"Amount\" = EXCLUDED.\"Amount\";"
                );
            }
            sqlBuilder.AppendLine();

            // 10. Payments
            var payments = await _context.Payments.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: Payments ({payments.Count} kayıt)");
            foreach (var pay in payments)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"Payments\" (\"Id\", \"PaymentNumber\", \"Type\", \"Method\", \"Amount\", \"PaymentDate\", \"Status\", \"CustomerId\", \"ReservationId\", \"SaleId\", \"UserId\", \"Reference\", \"Description\", \"Notes\", \"CreatedAt\", \"UpdatedAt\") " +
                    $"VALUES ({pay.Id}, {SqlString(pay.PaymentNumber)}, {(int)pay.Type}, {(int)pay.Method}, {SqlNum(pay.Amount)}, {SqlDate(pay.PaymentDate)}, {(int)pay.Status}, {SqlNullable(pay.CustomerId)}, {SqlNullable(pay.ReservationId)}, {SqlNullable(pay.SaleId)}, {SqlNullable(pay.UserId)}, {SqlString(pay.Reference)}, {SqlString(pay.Description)}, {SqlString(pay.Notes)}, {SqlDate(pay.CreatedAt)}, {SqlDate(pay.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Amount\" = EXCLUDED.\"Amount\";"
                );
            }
            sqlBuilder.AppendLine();

            // 11. SystemSettings
            var settings = await _context.SystemSettings.AsNoTracking().ToListAsync();
            sqlBuilder.AppendLine($"-- Table: SystemSettings ({settings.Count} kayıt)");
            foreach (var st in settings)
            {
                sqlBuilder.AppendLine(
                    $"INSERT INTO \"SystemSettings\" (\"Id\", \"Key\", \"Value\", \"Description\", \"UpdatedAt\") " +
                    $"VALUES ({st.Id}, {SqlString(st.Key)}, {SqlString(st.Value)}, {SqlString(st.Description)}, {SqlDate(st.UpdatedAt)}) " +
                    $"ON CONFLICT (\"Id\") DO UPDATE SET \"Value\" = EXCLUDED.\"Value\";"
                );
            }
            sqlBuilder.AppendLine();

            // Sequence Reset
            sqlBuilder.AppendLine("-- Reset PostgreSQL Primary Key Sequences");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Users\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Users\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Customers\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Customers\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Rooms\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Rooms\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Reservations\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Reservations\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"ReservationCustomers\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"ReservationCustomers\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Products\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Products\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Sales\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Sales\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"SaleItems\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"SaleItems\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Expenses\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Expenses\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"Payments\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"Payments\"), 1));");
            sqlBuilder.AppendLine("SELECT setval(pg_get_serial_sequence('\"SystemSettings\"', 'Id'), COALESCE((SELECT MAX(\"Id\") FROM \"SystemSettings\"), 1));");
            sqlBuilder.AppendLine();
            sqlBuilder.AppendLine("COMMIT;");

            await File.WriteAllTextAsync(filePath, sqlBuilder.ToString(), Encoding.UTF8);

            var fileInfo = new FileInfo(filePath);
            var settingsDto = await GetSettingsAsync();

            // Otomatik temizleme: MaxLocalBackupCount aşılmışsa en eski yedekleri sil
            await PruneOldBackupsAsync(settingsDto.MaxLocalBackupCount);

            return new BackupInfoDto
            {
                FileName = fileName,
                FileSizeBytes = fileInfo.Length,
                FileSizeFormatted = FormatBytes(fileInfo.Length),
                CreatedAt = fileInfo.CreationTime,
                DownloadUrl = $"/api/backup/download/{fileName}",
                IsAutoBackup = isAutoBackup,
            };
        }

        public async Task<bool> RestoreBackupAsync(Stream backupStream)
        {
            using var reader = new StreamReader(backupStream, Encoding.UTF8);
            var sqlContent = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(sqlContent))
            {
                throw new InvalidOperationException("Yedek dosyası boş veya geçersiz!");
            }

            // Güvenli restore: Raw SQL çalıştırma
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _context.Database.ExecuteSqlRawAsync(sqlContent);
                await transaction.CommitAsync();
                return true;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                throw new Exception($"Yedek geri yükleme hatası: {ex.Message}", ex);
            }
        }

        public List<BackupInfoDto> GetBackupsList()
        {
            if (!Directory.Exists(_backupDirectory)) return new List<BackupInfoDto>();

            var directoryInfo = new DirectoryInfo(_backupDirectory);
            var files = directoryInfo.GetFiles("*.sql")
                .OrderByDescending(f => f.CreationTime)
                .ToList();

            return files.Select(f => new BackupInfoDto
            {
                FileName = f.Name,
                FileSizeBytes = f.Length,
                FileSizeFormatted = FormatBytes(f.Length),
                CreatedAt = f.CreationTime,
                DownloadUrl = $"/api/backup/download/{f.Name}",
                IsAutoBackup = f.Name.StartsWith("auto_backup"),
            }).ToList();
        }

        public bool DeleteBackup(string fileName)
        {
            var filePath = Path.Combine(_backupDirectory, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                return true;
            }
            return false;
        }

        public async Task PruneOldBackupsAsync(int maxCount)
        {
            if (maxCount <= 0) maxCount = 5;

            var list = GetBackupsList();
            if (list.Count > maxCount)
            {
                var toDelete = list.Skip(maxCount).ToList();
                foreach (var item in toDelete)
                {
                    DeleteBackup(item.FileName);
                }
            }
            await Task.CompletedTask;
        }

        public async Task<BackupSettingsDto> GetSettingsAsync()
        {
            var settings = await _context.SystemSettings.AsNoTracking().ToListAsync();

            string GetVal(string key, string defaultVal) =>
                settings.FirstOrDefault(s => s.Key == key)?.Value ?? defaultVal;

            return new BackupSettingsDto
            {
                AutoBackupEnabled = bool.TryParse(GetVal("Backup_AutoEnabled", "true"), out var b) ? b : true,
                BackupIntervalHours = int.TryParse(GetVal("Backup_IntervalHours", "24"), out var i) ? i : 24,
                MaxLocalBackupCount = int.TryParse(GetVal("Backup_MaxLocalCount", "5"), out var m) ? m : 5,

                CloudBackupEnabled = bool.TryParse(GetVal("Cloud_Enabled", "false"), out var cb) ? cb : false,
                CloudProvider = GetVal("Cloud_Provider", "GoogleDrive"),
                CloudClientId = GetVal("Cloud_ClientId", ""),
                CloudClientSecret = GetVal("Cloud_ClientSecret", ""),
                CloudApiKeyToken = GetVal("Cloud_ApiKeyToken", ""),
                MaxCloudBackupCount = int.TryParse(GetVal("Cloud_MaxCount", "5"), out var cm) ? cm : 5,
            };
        }

        public async Task SaveSettingsAsync(BackupSettingsDto dto)
        {
            async Task SetVal(string key, string val, string desc)
            {
                var item = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == key);
                if (item == null)
                {
                    _context.SystemSettings.Add(new SystemSetting
                    {
                        Key = key,
                        Value = val ?? "",
                        Description = desc,
                        UpdatedAt = DateTime.Now
                    });
                }
                else
                {
                    item.Value = val ?? "";
                    item.UpdatedAt = DateTime.Now;
                }
            }

            await SetVal("Backup_AutoEnabled", dto.AutoBackupEnabled.ToString().ToLower(), "Otomatik yedekleme aktif/pasif");
            await SetVal("Backup_IntervalHours", dto.BackupIntervalHours.ToString(), "Yedekleme periyodu (saat)");
            await SetVal("Backup_MaxLocalCount", dto.MaxLocalBackupCount.ToString(), "Maksimum yerel yedek sayısı");

            await SetVal("Cloud_Enabled", dto.CloudBackupEnabled.ToString().ToLower(), "Bulut yedekleme aktif/pasif");
            await SetVal("Cloud_Provider", dto.CloudProvider, "Bulut servisi (GoogleDrive, YandexDisk, OneDrive)");
            await SetVal("Cloud_ClientId", dto.CloudClientId, "Bulut Client ID");
            await SetVal("Cloud_ClientSecret", dto.CloudClientSecret, "Bulut Client Secret");
            await SetVal("Cloud_ApiKeyToken", dto.CloudApiKeyToken, "Bulut API Key / Refresh Token");
            await SetVal("Cloud_MaxCount", dto.MaxCloudBackupCount.ToString(), "Maksimum bulut yedek sayısı");

            await _context.SaveChangesAsync();
        }

        // Helper formatting functions
        private static string SqlString(string? val) =>
            val == null ? "NULL" : $"'{val.Replace("'", "''")}'";

        private static string SqlDate(DateTime? val) =>
            val.HasValue ? $"'{val.Value:yyyy-MM-dd HH:mm:ss}'" : "NULL";

        private static string SqlBool(bool val) => val ? "TRUE" : "FALSE";

        private static string SqlNum(decimal val) => val.ToString(CultureInfo.InvariantCulture);

        private static string SqlNullable(int? val) => val.HasValue ? val.Value.ToString() : "NULL";

        private static string FormatBytes(long bytes)
        {
            string[] suffixes = { "B", "KB", "MB", "GB" };
            int i = 0;
            double dblSBr = bytes;
            while (dblSBr >= 1024 && i < suffixes.Length - 1)
            {
                i++;
                dblSBr /= 1024;
            }
            return $"{dblSBr:0.##} {suffixes[i]}";
        }
    }
}
