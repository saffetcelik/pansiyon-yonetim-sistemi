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

            // Manager kullanıcısı kaldırıldı - sadece admin kullanıcısı kalacak

            // Odalar gerçek kullanımda manuel olarak eklenecek
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Revert password changes
            migrationBuilder.Sql("UPDATE \"Users\" SET \"PasswordHash\" = 'old_hash_value' WHERE \"Username\" = 'admin';");
        }
    }
}
