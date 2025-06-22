using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PansiyonYonetimSistemi.API.Migrations
{
    /// <inheritdoc />
    public partial class UpdateUserPasswords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update admin password hash for "admin123"
            migrationBuilder.Sql("UPDATE \"Users\" SET \"PasswordHash\" = '$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxbGTpTSuuXikcgTjJ9S3EG' WHERE \"Username\" = 'admin';");

            // Update manager password hash for "manager123"
            migrationBuilder.Sql("UPDATE \"Users\" SET \"PasswordHash\" = '$2a$11$N9qo8uLOickgx2ZMRZoMye.IjdQXvbVxbGTpTSuuXikcgTjJ9S3EG' WHERE \"Username\" = 'manager';");

            // Insert Rooms
            migrationBuilder.InsertData(
                table: "Rooms",
                columns: new[] { "RoomNumber", "Type", "Status", "Capacity", "PricePerNight", "Description", "HasBalcony", "HasSeaView", "HasAirConditioning", "HasMinibar", "HasTV", "HasWiFi", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { "001", 0, 0, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "002", 0, 1, 1, 150.00m, "Single oda - 1 kişilik", true, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "003", 0, 1, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "004", 0, 4, 1, 150.00m, "Single oda - 1 kişilik", true, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "005", 0, 2, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "006", 1, 3, 2, 200.00m, "Double oda - 2 kişilik", true, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "007", 1, 2, 2, 200.00m, "Double oda - 2 kişilik", false, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "008", 1, 1, 2, 200.00m, "Double oda - 2 kişilik", true, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "009", 1, 0, 2, 200.00m, "Double oda - 2 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "010", 1, 1, 2, 200.00m, "Double oda - 2 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "011", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "012", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "013", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "014", 3, 0, 4, 300.00m, "Family oda - 4 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) },
                    { "015", 3, 0, 4, 300.00m, "Family oda - 4 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Utc) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Delete rooms
            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomNumber",
                keyValues: new object[] { "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015" });
        }
    }
}
