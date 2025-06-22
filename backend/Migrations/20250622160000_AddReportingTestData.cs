using Microsoft.EntityFrameworkCore.Migrations;
using PansiyonYonetimSistemi.API.Models;

#nullable disable

namespace PansiyonYonetimSistemi.API.Migrations
{
    /// <inheritdoc />
    public partial class AddReportingTestData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create Payments table
            migrationBuilder.CreateTable(
                name: "Payments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ReservationId = table.Column<int>(type: "integer", nullable: true),
                    CustomerId = table.Column<int>(type: "integer", nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Method = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    Description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Reference = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Payments_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Payments_Reservations_ReservationId",
                        column: x => x.ReservationId,
                        principalTable: "Reservations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            // Create Expenses table
            migrationBuilder.CreateTable(
                name: "Expenses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric(10,2)", nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    DueDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    PaidDate = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    Vendor = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    InvoiceNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Expenses", x => x.Id);
                });

            // Add indexes
            migrationBuilder.CreateIndex(
                name: "IX_Payments_CustomerId",
                table: "Payments",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Payments_ReservationId",
                table: "Payments",
                column: "ReservationId");

            // Add sample reservations for testing
            migrationBuilder.Sql(@"
                INSERT INTO ""Reservations"" (""CustomerId"", ""RoomId"", ""CheckInDate"", ""CheckOutDate"", ""NumberOfGuests"", ""TotalAmount"", ""PaidAmount"", ""Status"", ""Notes"", ""CreatedAt"", ""UpdatedAt"")
                VALUES 
                (1, 1, '2025-06-15', '2025-06-18', 1, 450.00, 450.00, 2, 'Completed reservation', '2025-06-15 10:00:00', '2025-06-18 12:00:00'),
                (2, 2, '2025-06-16', '2025-06-20', 1, 600.00, 600.00, 2, 'Completed reservation', '2025-06-16 14:00:00', '2025-06-20 11:00:00'),
                (3, 6, '2025-06-18', '2025-06-22', 2, 800.00, 800.00, 2, 'Completed reservation', '2025-06-18 15:00:00', '2025-06-22 10:00:00'),
                (4, 7, '2025-06-20', '2025-06-23', 2, 600.00, 600.00, 1, 'Current guest', '2025-06-20 16:00:00', '2025-06-20 16:00:00'),
                (5, 11, '2025-06-21', '2025-06-25', 3, 1000.00, 500.00, 1, 'Current guest', '2025-06-21 13:00:00', '2025-06-21 13:00:00'),
                (1, 3, '2025-06-10', '2025-06-13', 1, 450.00, 450.00, 2, 'Previous stay', '2025-06-10 09:00:00', '2025-06-13 11:00:00'),
                (6, 8, '2025-06-12', '2025-06-15', 2, 600.00, 600.00, 2, 'Completed reservation', '2025-06-12 12:00:00', '2025-06-15 10:00:00'),
                (7, 14, '2025-06-14', '2025-06-17', 4, 900.00, 900.00, 2, 'Family stay', '2025-06-14 14:00:00', '2025-06-17 12:00:00'),
                (8, 9, '2025-06-05', '2025-06-08', 2, 600.00, 600.00, 2, 'Early June stay', '2025-06-05 15:00:00', '2025-06-08 11:00:00'),
                (2, 12, '2025-06-08', '2025-06-11', 3, 750.00, 750.00, 2, 'Triple room stay', '2025-06-08 16:00:00', '2025-06-11 10:00:00');
            ");

            // Add sample payments for testing
            migrationBuilder.Sql(@"
                INSERT INTO ""Payments"" (""ReservationId"", ""CustomerId"", ""Amount"", ""Method"", ""Type"", ""Status"", ""PaymentDate"", ""Description"", ""Reference"", ""CreatedAt"", ""UpdatedAt"")
                VALUES 
                (1, 1, 450.00, 0, 0, 1, '2025-06-15 10:30:00', 'Room payment - 001', 'PAY-001', '2025-06-15 10:30:00', '2025-06-15 10:30:00'),
                (2, 2, 600.00, 1, 0, 1, '2025-06-16 14:30:00', 'Room payment - 002', 'PAY-002', '2025-06-16 14:30:00', '2025-06-16 14:30:00'),
                (3, 3, 800.00, 2, 0, 1, '2025-06-18 15:30:00', 'Room payment - 006', 'PAY-003', '2025-06-18 15:30:00', '2025-06-18 15:30:00'),
                (4, 4, 600.00, 0, 0, 1, '2025-06-20 16:30:00', 'Room payment - 007', 'PAY-004', '2025-06-20 16:30:00', '2025-06-20 16:30:00'),
                (5, 5, 500.00, 1, 0, 1, '2025-06-21 13:30:00', 'Partial payment - 011', 'PAY-005', '2025-06-21 13:30:00', '2025-06-21 13:30:00'),
                (6, 1, 450.00, 0, 0, 1, '2025-06-10 09:30:00', 'Room payment - 003', 'PAY-006', '2025-06-10 09:30:00', '2025-06-10 09:30:00'),
                (7, 6, 600.00, 1, 0, 1, '2025-06-12 12:30:00', 'Room payment - 008', 'PAY-007', '2025-06-12 12:30:00', '2025-06-12 12:30:00'),
                (8, 7, 900.00, 2, 0, 1, '2025-06-14 14:30:00', 'Room payment - 014', 'PAY-008', '2025-06-14 14:30:00', '2025-06-14 14:30:00'),
                (9, 8, 600.00, 0, 0, 1, '2025-06-05 15:30:00', 'Room payment - 009', 'PAY-009', '2025-06-05 15:30:00', '2025-06-05 15:30:00'),
                (10, 2, 750.00, 1, 0, 1, '2025-06-08 16:30:00', 'Room payment - 012', 'PAY-010', '2025-06-08 16:30:00', '2025-06-08 16:30:00'),
                (NULL, 1, 25.50, 0, 1, 1, '2025-06-15 18:00:00', 'Minibar sales', 'SALE-001', '2025-06-15 18:00:00', '2025-06-15 18:00:00'),
                (NULL, 2, 45.00, 0, 1, 1, '2025-06-16 20:00:00', 'Restaurant sales', 'SALE-002', '2025-06-16 20:00:00', '2025-06-16 20:00:00'),
                (NULL, 3, 35.75, 1, 1, 1, '2025-06-18 19:30:00', 'Beverage sales', 'SALE-003', '2025-06-18 19:30:00', '2025-06-18 19:30:00'),
                (NULL, 4, 60.00, 0, 1, 1, '2025-06-20 21:00:00', 'Dinner sales', 'SALE-004', '2025-06-20 21:00:00', '2025-06-20 21:00:00'),
                (NULL, 5, 28.25, 1, 1, 1, '2025-06-21 17:45:00', 'Snack sales', 'SALE-005', '2025-06-21 17:45:00', '2025-06-21 17:45:00'),
                (NULL, 1, 15.00, 0, 2, 1, '2025-06-10 14:00:00', 'Laundry service', 'SRV-001', '2025-06-10 14:00:00', '2025-06-10 14:00:00'),
                (NULL, 6, 30.00, 1, 2, 1, '2025-06-12 16:00:00', 'Room service', 'SRV-002', '2025-06-12 16:00:00', '2025-06-12 16:00:00'),
                (NULL, 7, 50.00, 2, 2, 1, '2025-06-14 18:00:00', 'Spa service', 'SRV-003', '2025-06-14 18:00:00', '2025-06-14 18:00:00');
            ");

            // Add sample expenses for testing
            migrationBuilder.Sql(@"
                INSERT INTO ""Expenses"" (""Title"", ""Description"", ""Amount"", ""Category"", ""Status"", ""DueDate"", ""PaidDate"", ""Vendor"", ""InvoiceNumber"", ""CreatedAt"", ""UpdatedAt"")
                VALUES 
                ('Electricity Bill', 'Monthly electricity bill for June 2025', 1250.00, 0, 1, '2025-06-30', '2025-06-22', 'TEDAŞ', 'ELC-2025-06', '2025-06-01 09:00:00', '2025-06-22 10:00:00'),
                ('Water Bill', 'Monthly water bill for June 2025', 450.00, 0, 1, '2025-06-28', '2025-06-20', 'ASAT', 'WTR-2025-06', '2025-06-01 09:00:00', '2025-06-20 11:00:00'),
                ('Internet Service', 'Monthly internet and phone service', 350.00, 0, 1, '2025-06-25', '2025-06-18', 'Türk Telekom', 'INT-2025-06', '2025-06-01 09:00:00', '2025-06-18 14:00:00'),
                ('Cleaning Supplies', 'Monthly cleaning supplies purchase', 850.00, 1, 1, '2025-06-15', '2025-06-15', 'Temizlik A.Ş.', 'CLN-2025-06', '2025-06-10 10:00:00', '2025-06-15 15:00:00'),
                ('Food & Beverage', 'Restaurant supplies for June', 2500.00, 1, 1, '2025-06-20', '2025-06-19', 'Gıda Tedarik Ltd.', 'FNB-2025-06', '2025-06-12 11:00:00', '2025-06-19 16:00:00'),
                ('Maintenance Service', 'Air conditioning maintenance', 750.00, 2, 1, '2025-06-10', '2025-06-10', 'Klima Servis', 'MNT-2025-06', '2025-06-05 12:00:00', '2025-06-10 17:00:00'),
                ('Staff Salaries', 'Monthly staff salaries for June', 15000.00, 3, 1, '2025-06-30', '2025-06-30', 'Internal', 'SAL-2025-06', '2025-06-01 09:00:00', '2025-06-30 18:00:00'),
                ('Insurance Premium', 'Monthly insurance premium', 1200.00, 4, 1, '2025-06-25', '2025-06-22', 'Sigorta A.Ş.', 'INS-2025-06', '2025-06-01 09:00:00', '2025-06-22 12:00:00'),
                ('Marketing Campaign', 'Social media advertising', 500.00, 5, 1, '2025-06-15', '2025-06-14', 'Dijital Ajans', 'MKT-2025-06', '2025-06-08 13:00:00', '2025-06-14 19:00:00'),
                ('Office Supplies', 'Monthly office supplies', 300.00, 6, 0, '2025-06-30', NULL, 'Ofis Malzeme', 'OFC-2025-06', '2025-06-20 14:00:00', '2025-06-20 14:00:00'),
                ('Equipment Repair', 'Washing machine repair', 450.00, 2, 0, '2025-06-28', NULL, 'Beyaz Eşya Servis', 'RPR-2025-06', '2025-06-22 15:00:00', '2025-06-22 15:00:00'),
                ('Legal Consultation', 'Monthly legal consultation fee', 800.00, 4, 0, '2025-07-01', NULL, 'Hukuk Bürosu', 'LGL-2025-06', '2025-06-20 16:00:00', '2025-06-20 16:00:00');
            ");

            // Update sequence values
            migrationBuilder.Sql(@"
                SELECT setval(pg_get_serial_sequence('""Reservations""', 'Id'), GREATEST((SELECT MAX(""Id"") FROM ""Reservations"") + 1, nextval(pg_get_serial_sequence('""Reservations""', 'Id'))), false);
                SELECT setval(pg_get_serial_sequence('""Payments""', 'Id'), GREATEST((SELECT MAX(""Id"") FROM ""Payments"") + 1, nextval(pg_get_serial_sequence('""Payments""', 'Id'))), false);
                SELECT setval(pg_get_serial_sequence('""Expenses""', 'Id'), GREATEST((SELECT MAX(""Id"") FROM ""Expenses"") + 1, nextval(pg_get_serial_sequence('""Expenses""', 'Id'))), false);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "Payments");
            migrationBuilder.DropTable(name: "Expenses");
        }
    }
}
