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
            // Idempotent: Kolonlar zaten varsa hata vermez
            migrationBuilder.Sql(@"
                ALTER TABLE ""Reservations"" ADD COLUMN IF NOT EXISTS ""ReservationName"" character varying(200);
                ALTER TABLE ""Reservations"" ADD COLUMN IF NOT EXISTS ""ReservationGroupId"" character varying(36);
                ALTER TABLE ""Reservations"" ALTER COLUMN ""CustomerId"" DROP NOT NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "ReservationName", table: "Reservations");
            migrationBuilder.DropColumn(name: "ReservationGroupId", table: "Reservations");

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
