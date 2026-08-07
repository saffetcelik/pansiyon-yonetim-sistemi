using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public class DatabaseBackupService : IDatabaseBackupService
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;
        private readonly IConfiguration _configuration;
        private readonly string _backupDirectory;

        public DatabaseBackupService(ApplicationDbContext context, IWebHostEnvironment env, IConfiguration configuration)
        {
            _context = context;
            _env = env;
            _configuration = configuration;
            _backupDirectory = _configuration["BackupSettings:DirectoryPath"] ?? Path.Combine(_env.ContentRootPath, "App_Data", "Backups");
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

            // 1. Yerel / Docker ortamında native pg_dump komutunu dene
            bool success = await TryCreateNativePgDumpAsync(filePath, isAutoBackup);

            // 2. pg_dump bulunamadıysa veya hata verdiyse Dinamik C# Dump Motoruna geç
            if (!success)
            {
                var sqlContent = await GenerateDynamicFullDumpSqlAsync(isAutoBackup);
                await File.WriteAllTextAsync(filePath, sqlContent, Encoding.UTF8);
            }

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

        private async Task<bool> TryCreateNativePgDumpAsync(string filePath, bool isAutoBackup)
        {
            try
            {
                var connString = _context.Database.GetConnectionString();
                if (string.IsNullOrWhiteSpace(connString)) return false;

                var builder = new NpgsqlConnectionStringBuilder(connString);
                var host = builder.Host ?? "localhost";
                var port = builder.Port > 0 ? builder.Port : 5432;
                var dbName = builder.Database;
                var username = builder.Username;
                var password = builder.Password;

                var startInfo = new ProcessStartInfo
                {
                    FileName = "pg_dump",
                    Arguments = $"--host={host} --port={port} --username={username} --dbname={dbName} --clean --if-exists --inserts --file=\"{filePath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (!string.IsNullOrWhiteSpace(password))
                {
                    startInfo.EnvironmentVariables["PGPASSWORD"] = password;
                }

                using var process = new Process { StartInfo = startInfo };
                process.Start();

                var error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode == 0 && File.Exists(filePath) && new FileInfo(filePath).Length > 0)
                {
                    Console.WriteLine($"[Backup] Native pg_dump ile full yedek alındı: {filePath}");
                    return true;
                }

                Console.WriteLine($"[Backup Note] pg_dump uyarısı: {error}. Dinamik C# motoru kullanılacak.");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Backup Note] pg_dump çalıştırılamadı ({ex.Message}). Dinamik C# yedekleme motoru devreye girdi.");
                return false;
            }
        }

        /// <summary>
        /// PostgreSQL Veritabanındaki TÜM tabloları, sütunları, veri tiplerini ve verileri
        /// hiçbir tablo adı elle yazılmadan DİNAMİK olarak sorgular ve tam SQL dump üretir.
        /// </summary>
        private async Task<string> GenerateDynamicFullDumpSqlAsync(bool isAutoBackup)
        {
            var sqlBuilder = new StringBuilder();
            sqlBuilder.AppendLine($"-- Pansiyon Yönetim Sistemi Dinamik Tam Veritabanı Yedeği (Full PostgreSQL Dump)");
            sqlBuilder.AppendLine($"-- Oluşturulma Tarihi: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sqlBuilder.AppendLine($"-- Otomatik Yedek: {(isAutoBackup ? "Evet" : "Hayır")}");
            sqlBuilder.AppendLine();

            var connection = _context.Database.GetDbConnection();
            var wasOpen = connection.State == ConnectionState.Open;
            if (!wasOpen) await connection.OpenAsync();

            try
            {
                // 1. Veritabanındaki TÜM Tablo İsimlerini Dinamik Çek
                var tableNames = new List<string>();
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                          AND table_type = 'BASE TABLE' 
                          AND table_name NOT LIKE '__EF%'
                        ORDER BY table_name;";

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            tableNames.Add(reader.GetString(0));
                        }
                    }
                }

                // 2. TÜM TABLOLAR İÇİN DİNAMİK DDL (CREATE TABLE IF NOT EXISTS) ÜRET
                sqlBuilder.AppendLine("-- ── 1. DİNAMİK ŞEMA TANIMLARI (CREATE TABLE IF NOT EXISTS) ────────");
                foreach (var tableName in tableNames)
                {
                    sqlBuilder.AppendLine($"-- Table Schema: \"{tableName}\"");
                    var columns = new List<ColumnMeta>();
                    using (var cmd = connection.CreateCommand())
                    {
                        cmd.CommandText = $@"
                            SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
                            FROM information_schema.columns
                            WHERE table_schema = 'public' AND table_name = '{tableName}'
                            ORDER BY ordinal_position;";

                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                columns.Add(new ColumnMeta
                                {
                                    Name = reader.GetString(0),
                                    DataType = reader.GetString(1),
                                    MaxLength = reader.IsDBNull(2) ? null : reader.GetInt32(2),
                                    IsNullable = reader.GetString(3) == "YES",
                                    DefaultValue = reader.IsDBNull(4) ? null : reader.GetString(4)
                                });
                            }
                        }
                    }

                    var colDefinitions = columns.Select(c =>
                    {
                        var nullStr = c.IsNullable ? "NULL" : "NOT NULL";
                        var typeStr = MapPgType(c.DataType, c.MaxLength);
                        var defStr = string.IsNullOrWhiteSpace(c.DefaultValue) ? "" : $" DEFAULT {c.DefaultValue}";
                        return $"    \"{c.Name}\" {typeStr} {nullStr}{defStr}";
                    });

                    sqlBuilder.AppendLine($"CREATE TABLE IF NOT EXISTS \"{tableName}\" (");
                    sqlBuilder.AppendLine(string.Join(",\n", colDefinitions));
                    sqlBuilder.AppendLine(");");
                    sqlBuilder.AppendLine();
                }

                // 3. TÜM TABLOLAR İÇİN DİNAMİK VERİ YÜKLEME (INSERT INTO STATEMENTS)
                sqlBuilder.AppendLine("-- ── 2. DİNAMİK VERİ KAYITLARI (INSERT INTO STATEMENTS) ─────────────");
                foreach (var tableName in tableNames)
                {
                    using (var cmd = connection.CreateCommand())
                    {
                        cmd.CommandText = $"SELECT * FROM \"{tableName}\";";
                        using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            var colCount = reader.FieldCount;
                            var colNames = new List<string>();
                            for (int i = 0; i < colCount; i++)
                            {
                                colNames.Add($"\"{reader.GetName(i)}\"");
                            }
                            var joinedCols = string.Join(", ", colNames);
                            int rowCount = 0;

                            while (await reader.ReadAsync())
                            {
                                rowCount++;
                                var vals = new List<string>();
                                for (int i = 0; i < colCount; i++)
                                {
                                    vals.Add(FormatSqlValue(reader.GetValue(i)));
                                }
                                var joinedVals = string.Join(", ", vals);
                                sqlBuilder.AppendLine($"INSERT INTO \"{tableName}\" ({joinedCols}) VALUES ({joinedVals}) ON CONFLICT DO NOTHING;");
                            }

                            sqlBuilder.AppendLine($"-- Total {rowCount} rows inserted for \"{tableName}\"");
                            sqlBuilder.AppendLine();
                        }
                    }
                }

                // 4. TÜM OTOMATİK SAYACLAR (SEQUENCES) İÇİN DİNAMİK RESET
                sqlBuilder.AppendLine("-- ── 3. DİNAMİK SEQUENCE SAYAÇ RESETLERİ ─────────────────────────");
                var sequences = new List<string>();
                using (var cmd = connection.CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT sequence_name 
                        FROM information_schema.sequences 
                        WHERE sequence_schema = 'public';";

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            sequences.Add(reader.GetString(0));
                        }
                    }
                }

                foreach (var seq in sequences)
                {
                    var parts = seq.Split('_');
                    if (parts.Length >= 2)
                    {
                        var targetTable = parts[0];
                        sqlBuilder.AppendLine($"SELECT setval('{seq}', COALESCE((SELECT MAX(\"Id\") FROM \"{targetTable}\"), 1), true);");
                    }
                }

                sqlBuilder.AppendLine();
                return sqlBuilder.ToString();
            }
            finally
            {
                if (!wasOpen) await connection.CloseAsync();
            }
        }

        public async Task<bool> RestoreBackupAsync(Stream backupStream)
        {
            using var reader = new StreamReader(backupStream, Encoding.UTF8);
            var sqlContent = await reader.ReadToEndAsync();

            if (string.IsNullOrWhiteSpace(sqlContent))
            {
                throw new InvalidOperationException("Yedek dosyası boş veya geçersiz!");
            }

            // 1. ÖNLEM: Geri yükleme öncesinde anlık Otomatik Güvenlik Yedeği (Safety Snapshot) al
            try
            {
                Console.WriteLine("[Restore Safety Net] Geri yükleme öncesi otomatik güvenlik yedeği alınıyor...");
                await CreateBackupAsync(isAutoBackup: true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Restore Safety Warning] Ön yedek alınırken hata (Devam ediliyor): {ex.Message}");
            }

            // 2. BLUE-GREEN FAIL-SAFE GERİ YÜKLEME MEKANİZMASI:
            // Orijinal public şeması silinmez! Adı public_backup_temp yapılır.
            // Yeni yedek yüklendikten sonra eğer BAŞARILI olursa eski şema imha edilir.
            // Eğer BAŞARISIZ olursa ROLLBACK ile eski şema anında ve kayıpsız geri gelir!
            var tempRestoreFile = Path.Combine(Path.GetTempPath(), $"restore_{Guid.NewGuid()}.sql");
            
            var failSafeSql = new StringBuilder();
            failSafeSql.AppendLine("BEGIN;");
            failSafeSql.AppendLine("ALTER SCHEMA public RENAME TO public_backup_temp;");
            failSafeSql.AppendLine("CREATE SCHEMA public;");
            failSafeSql.AppendLine("GRANT ALL ON SCHEMA public TO public;");
            failSafeSql.AppendLine(sqlContent);
            failSafeSql.AppendLine("DROP SCHEMA public_backup_temp CASCADE;");
            failSafeSql.AppendLine("COMMIT;");

            await File.WriteAllTextAsync(tempRestoreFile, failSafeSql.ToString(), Encoding.UTF8);

            try
            {
                // A. Yerel / Docker psql komutunu dene (Atomik Transaction ile)
                bool nativeSuccess = await TryRestoreNativePsqlAsync(tempRestoreFile);
                if (nativeSuccess)
                {
                    Console.WriteLine("[Restore Success] Blue-Green yedek geri yükleme başarıyla tamamlandı!");
                    return true;
                }
            }
            finally
            {
                if (File.Exists(tempRestoreFile)) File.Delete(tempRestoreFile);
            }

            // B. psql çalıştırılamadıysa EF Core Transactional Rollback ile Blue-Green Geri Yükle
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Mevcut şemayı sakla, yeni temiz şema aç
                await _context.Database.ExecuteSqlRawAsync(@"
                    ALTER SCHEMA public RENAME TO public_backup_temp;
                    CREATE SCHEMA public;
                    GRANT ALL ON SCHEMA public TO public;
                ");

                // 2. Yedeği yükle
                await _context.Database.ExecuteSqlRawAsync(sqlContent);

                // 3. Başarılı ise geçici şemayı temizle
                await _context.Database.ExecuteSqlRawAsync(@"
                    DROP SCHEMA public_backup_temp CASCADE;
                ");

                await transaction.CommitAsync();
                Console.WriteLine("[Restore Success] EF Core Blue-Green yedek geri yükleme tamamlandı!");
                return true;
            }
            catch (Exception ex)
            {
                // BAŞARISIZLIK DURUMUNDA OTOMATİK ROLLBACK:
                // Transaction iptal edilir, public_backup_temp anında orijinal public ismine geri döner!
                await transaction.RollbackAsync();
                Console.WriteLine($"[Restore Fail-Safe Executed] Geri yükleme başarısız olduğu için otomatik ROLLBACK yapıldı: {ex.Message}");
                throw new Exception($"Yedek dosyası hatalı veya uyumsuz! Geri yükleme İPTAL EDİLDİ ve mevcut verileriniz HİÇBİR KAYIP OLMADAN korundu. Detay: {ex.Message}", ex);
            }
        }

        private async Task<bool> TryRestoreNativePsqlAsync(string filePath)
        {
            try
            {
                var connString = _context.Database.GetConnectionString();
                if (string.IsNullOrWhiteSpace(connString)) return false;

                var builder = new NpgsqlConnectionStringBuilder(connString);
                var host = builder.Host ?? "localhost";
                var port = builder.Port > 0 ? builder.Port : 5432;
                var dbName = builder.Database;
                var username = builder.Username;
                var password = builder.Password;

                var startInfo = new ProcessStartInfo
                {
                    FileName = "psql",
                    Arguments = $"--host={host} --port={port} --username={username} --dbname={dbName} --file=\"{filePath}\"",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                };

                if (!string.IsNullOrWhiteSpace(password))
                {
                    startInfo.EnvironmentVariables["PGPASSWORD"] = password;
                }

                using var process = new Process { StartInfo = startInfo };
                process.Start();

                var error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                if (process.ExitCode == 0)
                {
                    Console.WriteLine("[Restore] Native psql ile veritabanı başarıyla geri yüklendi.");
                    return true;
                }

                Console.WriteLine($"[Restore Note] psql uyarısı: {error}. EF Core raw sql geri yüklemesi kullanılacak.");
                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Restore Note] psql çalıştırılamadı ({ex.Message}). EF Core raw sql kullanılıyor.");
                return false;
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
                BackupTimeOfDay = GetVal("Backup_TimeOfDay", "03:00"),
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
            await SetVal("Backup_TimeOfDay", dto.BackupTimeOfDay, "Otomatik yedekleme saati (HH:mm)");
            await SetVal("Backup_MaxLocalCount", dto.MaxLocalBackupCount.ToString(), "Maksimum yerel yedek sayısı");

            await SetVal("Cloud_Enabled", dto.CloudBackupEnabled.ToString().ToLower(), "Bulut yedekleme aktif/pasif");
            await SetVal("Cloud_Provider", dto.CloudProvider, "Bulut servisi (GoogleDrive, YandexDisk, OneDrive)");
            await SetVal("Cloud_ClientId", dto.CloudClientId, "Bulut Client ID");
            await SetVal("Cloud_ClientSecret", dto.CloudClientSecret, "Bulut Client Secret");
            await SetVal("Cloud_ApiKeyToken", dto.CloudApiKeyToken, "Bulut API Key / Refresh Token");
            await SetVal("Cloud_MaxCount", dto.MaxCloudBackupCount.ToString(), "Maksimum bulut yedek sayısı");

            await _context.SaveChangesAsync();
        }

        // ── Helper Meta & Formatting Functions ─────────────────────────────
        private class ColumnMeta
        {
            public string Name { get; set; } = string.Empty;
            public string DataType { get; set; } = string.Empty;
            public int? MaxLength { get; set; }
            public bool IsNullable { get; set; }
            public string? DefaultValue { get; set; }
        }

        private static string MapPgType(string rawType, int? maxLen)
        {
            return rawType.ToLower() switch
            {
                "character varying" => maxLen.HasValue ? $"character varying({maxLen})" : "text",
                "character" => maxLen.HasValue ? $"character({maxLen})" : "character(1)",
                "timestamp without time zone" => "timestamp without time zone",
                "timestamp with time zone" => "timestamp with time zone",
                "USER-DEFINED" => "text",
                _ => rawType
            };
        }

        private static string FormatSqlValue(object val)
        {
            if (val == DBNull.Value || val == null) return "NULL";

            return val switch
            {
                bool b => b ? "TRUE" : "FALSE",
                DateTime dt => $"'{dt:yyyy-MM-dd HH:mm:ss.fff}'",
                DateTimeOffset dto => $"'{dto:yyyy-MM-dd HH:mm:ss.fff zzz}'",
                string s => $"'{s.Replace("'", "''")}'",
                decimal dec => dec.ToString(CultureInfo.InvariantCulture),
                double d => d.ToString(CultureInfo.InvariantCulture),
                float f => f.ToString(CultureInfo.InvariantCulture),
                byte[] bytes => $"decode('{Convert.ToHexString(bytes)}', 'hex')",
                _ => $"'{val.ToString()?.Replace("'", "''")}'"
            };
        }

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
