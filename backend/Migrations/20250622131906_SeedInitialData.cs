using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PansiyonYonetimSistemi.API.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert Users - Sadece admin kullanıcısı
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Username", "PasswordHash", "FirstName", "LastName", "Email", "Phone", "Role", "IsActive", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { "admin", "$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxbGTpTSuuXikcgTjJ9S3EG", "Admin", "User", "admin@pansiyon.com", "0532 000 00 01", 0, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) }
                });

            // Müşteriler gerçek kullanımda manuel olarak eklenecek
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Delete seed data
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Username",
                keyValues: new object[] { "admin" });
        }
    }
}
