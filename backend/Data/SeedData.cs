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

            // Seed Users - Force recreate for password fix
            // Delete existing users first
            var existingUsers = await context.Users.ToListAsync();
            if (existingUsers.Any())
            {
                context.Users.RemoveRange(existingUsers);
                await context.SaveChangesAsync();
            }

            // Always create users with correct password hash
            {
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

                var managerUser = new User
                {
                    Username = "manager",
                    FirstName = "Müdür",
                    LastName = "Bey",
                    Email = "manager@gunespansiyon.com",
                    PasswordHash = HashPassword("manager123"),
                    Role = UserRole.Manager,
                    Phone = "0532 123 45 68",
                    IsActive = true
                };

                context.Users.AddRange(adminUser, managerUser);
                await context.SaveChangesAsync();
            }

            // Seed Rooms
            if (!await context.Rooms.AnyAsync())
            {
                var rooms = new List<Room>();
                
                // 15 oda oluştur
                for (int i = 1; i <= 15; i++)
                {
                    var roomType = i <= 5 ? RoomType.Single : 
                                  i <= 10 ? RoomType.Double : 
                                  i <= 13 ? RoomType.Triple : RoomType.Family;
                    
                    var capacity = roomType switch
                    {
                        RoomType.Single => 1,
                        RoomType.Double => 2,
                        RoomType.Triple => 3,
                        RoomType.Family => 4,
                        _ => 2
                    };

                    var price = roomType switch
                    {
                        RoomType.Single => 150m,
                        RoomType.Double => 200m,
                        RoomType.Triple => 250m,
                        RoomType.Family => 300m,
                        _ => 200m
                    };

                    rooms.Add(new Room
                    {
                        RoomNumber = i.ToString("D3"),
                        Type = roomType,
                        Status = RoomStatus.Available,
                        Capacity = capacity,
                        PricePerNight = price,
                        Description = $"{roomType} oda - {capacity} kişilik",
                        HasBalcony = i % 2 == 0,
                        HasSeaView = i <= 8,
                        HasAirConditioning = true,
                        HasMinibar = i > 5,
                        HasTV = true,
                        HasWiFi = true
                    });
                }

                context.Rooms.AddRange(rooms);
                await context.SaveChangesAsync();
            }

            // Seed Sample Products
            if (!await context.Products.AnyAsync())
            {
                var products = new List<Product>
                {
                    new Product { Name = "Su 0.5L", Category = ProductCategory.Beverage, Price = 5m, CostPrice = 2m, StockQuantity = 100, Unit = "Adet" },
                    new Product { Name = "Çay", Category = ProductCategory.Beverage, Price = 8m, CostPrice = 3m, StockQuantity = 50, Unit = "Bardak" },
                    new Product { Name = "Kahve", Category = ProductCategory.Beverage, Price = 15m, CostPrice = 6m, StockQuantity = 30, Unit = "Fincan" },
                    new Product { Name = "Sandviç", Category = ProductCategory.Food, Price = 25m, CostPrice = 12m, StockQuantity = 20, Unit = "Adet" },
                    new Product { Name = "Cips", Category = ProductCategory.Snack, Price = 12m, CostPrice = 5m, StockQuantity = 40, Unit = "Paket" },
                    new Product { Name = "Çikolata", Category = ProductCategory.Snack, Price = 18m, CostPrice = 8m, StockQuantity = 25, Unit = "Adet" },
                    new Product { Name = "Şampuan", Category = ProductCategory.Personal, Price = 35m, CostPrice = 15m, StockQuantity = 15, Unit = "Adet" },
                    new Product { Name = "Diş Fırçası", Category = ProductCategory.Personal, Price = 20m, CostPrice = 8m, StockQuantity = 20, Unit = "Adet" }
                };

                context.Products.AddRange(products);
                await context.SaveChangesAsync();
            }
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
