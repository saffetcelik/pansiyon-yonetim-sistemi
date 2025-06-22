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
            // Insert Users
            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Username", "PasswordHash", "FirstName", "LastName", "Email", "Phone", "Role", "IsActive", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { "admin", "$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxbGTpTSuuXikcgTjJ9S3EG", "Admin", "User", "admin@pansiyon.com", "0532 000 00 01", 0, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "manager", "$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxbGTpTSuuXikcgTjJ9S3EG", "Manager", "User", "manager@pansiyon.com", "0532 000 00 02", 1, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) }
                });

            // Insert Customers
            migrationBuilder.InsertData(
                table: "Customers",
                columns: new[] { "FirstName", "LastName", "TCKimlikNo", "PassportNo", "Phone", "Email", "Address", "City", "Country", "DateOfBirth", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { "Ahmet", "Yılmaz", "12345678901", null, "0532 123 45 67", "ahmet.yilmaz@email.com", "Atatürk Cad. No:15 Merkez", "Antalya", "Türkiye", new DateTime(1985, 5, 15, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Fatma", "Kaya", "98765432109", null, "0533 987 65 43", "fatma.kaya@email.com", "İnönü Sok. No:8 Merkez", "İstanbul", "Türkiye", new DateTime(1990, 8, 22, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "John", "Smith", null, "US123456789", "+1 555 123 4567", "john.smith@email.com", "123 Main Street", "New York", "USA", new DateTime(1982, 12, 10, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Maria", "Garcia", null, "ES987654321", "+34 666 123 456", "maria.garcia@email.com", "Calle Mayor 45", "Madrid", "Spain", new DateTime(1988, 3, 18, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Mehmet", "Demir", "11223344556", null, "0534 111 22 33", "mehmet.demir@email.com", "Cumhuriyet Mah. 123. Sok. No:7", "Ankara", "Türkiye", new DateTime(1975, 11, 5, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Ayşe", "Özkan", "55667788990", null, "0535 555 66 77", "ayse.ozkan@email.com", "Bahçelievler Mah. 456. Cad. No:12", "İzmir", "Türkiye", new DateTime(1992, 7, 30, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Pierre", "Dubois", null, "FR456789123", "+33123456789", "pierre.dubois@email.com", "15 Rue de la Paix", "Paris", "France", new DateTime(1980, 4, 12, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "Elena", "Rossi", null, "IT789123456", "+39061234567", "elena.rossi@email.com", "Via Roma 25", "Rome", "Italy", new DateTime(1987, 9, 8, 0, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Delete seed data in reverse order
            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "TCKimlikNo",
                keyValues: new object[] { "12345678901", "98765432109", "11223344556", "55667788990" });

            migrationBuilder.DeleteData(
                table: "Customers",
                keyColumn: "PassportNo",
                keyValues: new object[] { "US123456789", "ES987654321", "FR456789123", "IT789123456" });

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Username",
                keyValues: new object[] { "admin", "manager" });
        }
    }
}
