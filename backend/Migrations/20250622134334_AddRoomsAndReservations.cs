using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PansiyonYonetimSistemi.API.Migrations
{
    /// <inheritdoc />
    public partial class AddRoomsAndReservations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Users",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastLoginDate",
                table: "Users",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TransactionDate",
                table: "StockTransactions",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "StockTransactions",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SaleDate",
                table: "Sales",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Sales",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Rooms",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Rooms",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CheckOutDate",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CheckInDate",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualCheckOutDate",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualCheckInDate",
                table: "Reservations",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Products",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Products",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Logs",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Customers",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateOfBirth",
                table: "Customers",
                type: "timestamp without time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Customers",
                type: "timestamp without time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            // Insert Rooms
            migrationBuilder.InsertData(
                table: "Rooms",
                columns: new[] { "RoomNumber", "Type", "Status", "Capacity", "PricePerNight", "Description", "HasBalcony", "HasSeaView", "HasAirConditioning", "HasMinibar", "HasTV", "HasWiFi", "CreatedAt", "UpdatedAt" },
                values: new object[,]
                {
                    { "001", 0, 0, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "002", 0, 1, 1, 150.00m, "Single oda - 1 kişilik", true, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "003", 0, 1, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "004", 0, 4, 1, 150.00m, "Single oda - 1 kişilik", true, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "005", 0, 2, 1, 150.00m, "Single oda - 1 kişilik", false, true, true, false, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "006", 1, 3, 2, 200.00m, "Double oda - 2 kişilik", true, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "007", 1, 2, 2, 200.00m, "Double oda - 2 kişilik", false, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "008", 1, 1, 2, 200.00m, "Double oda - 2 kişilik", true, true, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "009", 1, 0, 2, 200.00m, "Double oda - 2 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "010", 1, 1, 2, 200.00m, "Double oda - 2 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "011", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "012", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "013", 2, 0, 3, 250.00m, "Triple oda - 3 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "014", 3, 0, 4, 300.00m, "Family oda - 4 kişilik", true, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) },
                    { "015", 3, 0, 4, 300.00m, "Family oda - 4 kişilik", false, false, true, true, true, true, new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified), new DateTime(2025, 6, 22, 13, 0, 0, DateTimeKind.Unspecified) }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "LastLoginDate",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "TransactionDate",
                table: "StockTransactions",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "StockTransactions",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "SaleDate",
                table: "Sales",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Sales",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Rooms",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Rooms",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CheckOutDate",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CheckInDate",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualCheckOutDate",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "ActualCheckInDate",
                table: "Reservations",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Products",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Logs",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            migrationBuilder.AlterColumn<DateTime>(
                name: "UpdatedAt",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "DateOfBirth",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone",
                oldNullable: true);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Customers",
                type: "timestamp with time zone",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "timestamp without time zone");

            // Delete rooms
            migrationBuilder.DeleteData(
                table: "Rooms",
                keyColumn: "RoomNumber",
                keyValues: new object[] { "001", "002", "003", "004", "005", "006", "007", "008", "009", "010", "011", "012", "013", "014", "015" });
        }
    }
}
