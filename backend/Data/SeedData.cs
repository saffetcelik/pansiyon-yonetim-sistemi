using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Models;
using System.Security.Cryptography;
using System.Text;

namespace PansiyonYonetimSistemi.API.Data
{
    public static class SeedData
    {
        public static async Task SeedAsync(ApplicationDbContext context)
        {
            // Ensure database is created
            await context.Database.EnsureCreatedAsync();

            // Seed Users - Only admin user
            if (!await context.Users.AnyAsync())
            {
                Console.WriteLine("No users found. Creating admin user...");

                var adminUser = new User
                {
                    Username = "admin",
                    FirstName = "Sistem",
                    LastName = "Yöneticisi",
                    Email = "admin@gunespansiyon.com",
                    PasswordHash = HashPassword("admin123"),
                    Role = UserRole.Admin,
                    Phone = "0532 123 45 67",
                    IsActive = true
                };

                context.Users.Add(adminUser);
                await context.SaveChangesAsync();
                Console.WriteLine("Admin user created successfully.");
            }
            else
            {
                Console.WriteLine("Users already exist. Skipping user creation.");
            }

            // Tüm diğer veriler (müşteriler, odalar, ürünler, rezervasyonlar) 
            // gerçek kullanımda manuel olarak eklenecek
        }

        private static string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                // Add salt to match PasswordService
                var saltedPassword = password + "PansiyonYonetimSistemi_Salt_2024";
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }
    }
}
