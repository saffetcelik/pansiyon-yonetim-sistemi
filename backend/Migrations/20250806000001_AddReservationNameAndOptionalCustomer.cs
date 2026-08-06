using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PansiyonYonetimSistemi.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReservationNameAndOptionalCustomer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // ReservationName sütunu ekle (nullable, max 200 karakter)
            migrationBuilder.AddColumn<string>(
                name: "ReservationName",
                table: "Reservations",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            // ReservationGroupId sütunu ekle (nullable, max 36 karakter - UUID)
            migrationBuilder.AddColumn<string>(
                name: "ReservationGroupId",
                table: "Reservations",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            // CustomerId'yi nullable yap
            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Reservations",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // ReservationName sütununu kaldır
            migrationBuilder.DropColumn(
                name: "ReservationName",
                table: "Reservations");

            // ReservationGroupId sütununu kaldır
            migrationBuilder.DropColumn(
                name: "ReservationGroupId",
                table: "Reservations");

            // CustomerId'yi zorunlu (non-nullable) yap - dikkat: nullable kayıtlar için 0 kullanılacak
            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "Reservations",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldNullable: true,
                oldType: "integer");
        }
    }
}
