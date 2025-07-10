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

            // Seed Rooms - Force recreate
            // Delete existing reservations first (foreign key constraint)
            var existingReservations = await context.Reservations.ToListAsync();
            if (existingReservations.Any())
            {
                context.Reservations.RemoveRange(existingReservations);
                await context.SaveChangesAsync();
            }

            // Delete existing rooms
            var existingRooms = await context.Rooms.ToListAsync();
            if (existingRooms.Any())
            {
                context.Rooms.RemoveRange(existingRooms);
                await context.SaveChangesAsync();
            }

            // Always create rooms
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

            // Seed Sample Customers - DISABLED FOR PRODUCTION
            // Müşteriler gerçek kullanımda manuel olarak eklenecek
            // if (!await context.Customers.AnyAsync())
            // {
            //     // Test müşterileri burada olacak
            // }

            // Seed Sample Products - Force recreate
            // Delete existing products first
            var existingProducts = await context.Products.ToListAsync();
            if (existingProducts.Any())
            {
                context.Products.RemoveRange(existingProducts);
                await context.SaveChangesAsync();
            }

            // Always create products
            {
                var products = new List<Product>
                {
                    // İçecekler
                    new Product
                    {
                        Name = "Çay",
                        Description = "Sıcak demli çay",
                        Category = ProductCategory.Beverage,
                        Price = 8m,
                        StockQuantity = 50,
                        MinStockLevel = 10,

                        Unit = "Bardak",
                        Barcode = "8690123456789",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Türk Kahvesi",
                        Description = "Geleneksel Türk kahvesi",
                        Category = ProductCategory.Beverage,
                        Price = 15m,
                        StockQuantity = 30,
                        MinStockLevel = 5,
                        Unit = "Fincan",
                        Barcode = "8690123456790",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Coca Cola",
                        Description = "330ml kutu kola",
                        Category = ProductCategory.Beverage,
                        Price = 12m,
                        StockQuantity = 48,
                        MinStockLevel = 12,
                        Unit = "Kutu",
                        Barcode = "8690123456791",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Su",
                        Description = "500ml doğal kaynak suyu",
                        Category = ProductCategory.Beverage,
                        Price = 5m,
                        StockQuantity = 60,
                        MinStockLevel = 20,
                        Unit = "Şişe",
                        Barcode = "8690123456792",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },

                    // Atıştırmalıklar
                    new Product
                    {
                        Name = "Cips",
                        Description = "Patates cipsi 150g",
                        Category = ProductCategory.Snack,
                        Price = 12m,
                        StockQuantity = 40,
                        MinStockLevel = 8,
                        Unit = "Paket",
                        Barcode = "8690123456793",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Çikolata",
                        Description = "Sütlü çikolata 80g",
                        Category = ProductCategory.Snack,
                        Price = 18m,
                        StockQuantity = 25,
                        MinStockLevel = 5,
                        Unit = "Adet",
                        Barcode = "8690123456794",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Bisküvi",
                        Description = "Çikolatalı bisküvi paketi",
                        Category = ProductCategory.Snack,
                        Price = 15m,
                        StockQuantity = 30,
                        MinStockLevel = 6,
                        Unit = "Paket",
                        Barcode = "8690123456795",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Kuruyemiş",
                        Description = "Karışık kuruyemiş 200g",
                        Category = ProductCategory.Snack,
                        Price = 25m,
                        StockQuantity = 20,
                        MinStockLevel = 4,
                        Unit = "Paket",
                        Barcode = "8690123456796",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },

                    // Kişisel Bakım
                    new Product
                    {
                        Name = "Şampuan",
                        Description = "Doğal şampuan 250ml",
                        Category = ProductCategory.Personal,
                        Price = 35m,
                        StockQuantity = 15,
                        MinStockLevel = 3,
                        Unit = "Adet",
                        Barcode = "8690123456797",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Diş Fırçası",
                        Description = "Yumuşak diş fırçası",
                        Category = ProductCategory.Personal,
                        Price = 20m,
                        StockQuantity = 20,
                        MinStockLevel = 5,
                        Unit = "Adet",
                        Barcode = "8690123456798",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Sabun",
                        Description = "Doğal zeytinyağı sabunu",
                        Category = ProductCategory.Personal,
                        Price = 18m,
                        StockQuantity = 25,
                        MinStockLevel = 5,
                        Unit = "Adet",
                        Barcode = "8690123456799",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },

                    // Temizlik
                    new Product
                    {
                        Name = "Havlu",
                        Description = "Pamuklu banyo havlusu",
                        Category = ProductCategory.Other,
                        Price = 45m,
                        StockQuantity = 12,
                        MinStockLevel = 3,
                        Unit = "Adet",
                        Barcode = "8690123456800",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Tuvalet Kağıdı",
                        Description = "3 katlı tuvalet kağıdı 12'li",
                        Category = ProductCategory.Other,
                        Price = 28m,
                        StockQuantity = 18,
                        MinStockLevel = 4,
                        Unit = "Paket",
                        Barcode = "8690123456801",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },

                    // Diğer
                    new Product
                    {
                        Name = "Şarj Aleti",
                        Description = "Universal telefon şarj aleti",
                        Category = ProductCategory.Other,
                        Price = 65m,
                        StockQuantity = 8,
                        MinStockLevel = 2,
                        Unit = "Adet",
                        Barcode = "8690123456802",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Product
                    {
                        Name = "Terlik",
                        Description = "Tek kullanımlık terlik",
                        Category = ProductCategory.Other,
                        Price = 15m,
                        StockQuantity = 30,
                        MinStockLevel = 6,
                        Unit = "Çift",
                        Barcode = "8690123456803",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                context.Products.AddRange(products);
                await context.SaveChangesAsync();
            }

            // Seed Sample Reservations - DISABLED FOR PRODUCTION
            // Rezervasyonlar gerçek kullanımda manuel olarak eklenecek
            // if (!await context.Reservations.AnyAsync())
            // {
            //     // Test rezervasyonları burada olacak
            // }
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
