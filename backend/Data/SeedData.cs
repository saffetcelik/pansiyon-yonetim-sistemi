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

            // Seed Users - Only if no users exist (SAFE APPROACH)
            if (!await context.Users.AnyAsync())
            {
                Console.WriteLine("No users found. Creating default users...");

                // Create default users only if database is empty
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
                Console.WriteLine("Default users created successfully.");
            }
            else
            {
                Console.WriteLine("Users already exist. Skipping user creation.");
            }

            // Seed Rooms - Only if no rooms exist (SAFE APPROACH)
            if (!await context.Rooms.AnyAsync())
            {
                Console.WriteLine("No rooms found. Creating default rooms...");

                // Create default rooms only if database is empty
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
                Console.WriteLine("Default rooms created successfully.");
            }
            else
            {
                Console.WriteLine("Rooms already exist. Skipping room creation.");
            }

            // Seed Sample Customers - DISABLED FOR PRODUCTION
            // Müşteriler gerçek kullanımda manuel olarak eklenecek
            // if (!await context.Customers.AnyAsync())
            // {
            //     // Test müşterileri burada olacak
            // }

            // Seed Sample Products - Only if no products exist (SAFE APPROACH)
            if (!await context.Products.AnyAsync())
            {
                Console.WriteLine("No products found. Creating default products...");

                // Create default products only if database is empty
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
                Console.WriteLine("Default products created successfully.");
            }
            else
            {
                Console.WriteLine("Products already exist. Skipping product creation.");
            }

            // Seed Sample Reservations for testing
            if (!await context.Reservations.AnyAsync())
            {
                var sampleCustomer = await context.Customers.FirstOrDefaultAsync();
                var room1 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "101");
                var room2 = await context.Rooms.FirstOrDefaultAsync(r => r.RoomNumber == "102");

                if (sampleCustomer == null || room1 == null || room2 == null)
                {
                    Console.WriteLine("Cannot create sample reservations: Missing customer or rooms");
                    return;
                }

                var sampleReservations = new[]
                {
                    new Reservation
                    {
                        CustomerId = sampleCustomer.Id,
                        RoomId = room1.Id,
                        CheckInDate = DateTime.Today.AddDays(1), // Yarın
                        CheckOutDate = DateTime.Today.AddDays(4), // 3 gün sonra
                        NumberOfGuests = 1,
                        TotalAmount = 450, // 3 gece × 150 TL
                        PaidAmount = 450,
                        Status = ReservationStatus.Confirmed,
                        Notes = "Test rezervasyonu - Oda 101",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    },
                    new Reservation
                    {
                        CustomerId = sampleCustomer.Id,
                        RoomId = room2.Id,
                        CheckInDate = DateTime.Today.AddDays(5), // 5 gün sonra
                        CheckOutDate = DateTime.Today.AddDays(8), // 8 gün sonra
                        NumberOfGuests = 2,
                        TotalAmount = 600, // 3 gece × 200 TL
                        PaidAmount = 300,
                        Status = ReservationStatus.Confirmed,
                        Notes = "Test rezervasyonu - Oda 102",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    }
                };

                context.Reservations.AddRange(sampleReservations);
                await context.SaveChangesAsync();

                Console.WriteLine($"Sample reservations created:");
                foreach (var res in sampleReservations)
                {
                    var room = await context.Rooms.FindAsync(res.RoomId);
                    Console.WriteLine($"  - Room {room.RoomNumber}: {res.CheckInDate:yyyy-MM-dd} to {res.CheckOutDate:yyyy-MM-dd}");
                }
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
