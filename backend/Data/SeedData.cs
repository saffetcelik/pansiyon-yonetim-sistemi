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

            // Seed Sample Customers
            if (!await context.Customers.AnyAsync())
            {
                var customers = new List<Customer>
                {
                    new Customer
                    {
                        FirstName = "Ahmet",
                        LastName = "Yılmaz",
                        TCKimlikNo = "12345678901",
                        Phone = "0532 123 45 67",
                        Email = "ahmet.yilmaz@email.com",
                        Address = "Atatürk Cad. No:15 Merkez",
                        City = "Antalya",
                        Country = "Türkiye",
                        DateOfBirth = new DateTime(1985, 5, 15, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    },
                    new Customer
                    {
                        FirstName = "Fatma",
                        LastName = "Kaya",
                        TCKimlikNo = "98765432109",
                        Phone = "0533 987 65 43",
                        Email = "fatma.kaya@email.com",
                        Address = "İnönü Sok. No:8 Merkez",
                        City = "İstanbul",
                        Country = "Türkiye",
                        DateOfBirth = new DateTime(1990, 8, 22, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    },
                    new Customer
                    {
                        FirstName = "John",
                        LastName = "Smith",
                        PassportNo = "US123456789",
                        Phone = "+1 555 123 4567",
                        Email = "john.smith@email.com",
                        Address = "123 Main Street",
                        City = "New York",
                        Country = "USA",
                        DateOfBirth = new DateTime(1982, 12, 10, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    },
                    new Customer
                    {
                        FirstName = "Maria",
                        LastName = "Garcia",
                        PassportNo = "ES987654321",
                        Phone = "+34 666 123 456",
                        Email = "maria.garcia@email.com",
                        Address = "Calle Mayor 45",
                        City = "Madrid",
                        Country = "Spain",
                        DateOfBirth = new DateTime(1988, 3, 18, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    },
                    new Customer
                    {
                        FirstName = "Mehmet",
                        LastName = "Demir",
                        TCKimlikNo = "11223344556",
                        Phone = "0534 111 22 33",
                        Email = "mehmet.demir@email.com",
                        Address = "Cumhuriyet Mah. 123. Sok. No:7",
                        City = "Ankara",
                        Country = "Türkiye",
                        DateOfBirth = new DateTime(1975, 11, 5, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    },
                    new Customer
                    {
                        FirstName = "Ayşe",
                        LastName = "Özkan",
                        TCKimlikNo = "55667788990",
                        Phone = "0535 555 66 77",
                        Email = "ayse.ozkan@email.com",
                        Address = "Bahçelievler Mah. 456. Cad. No:12",
                        City = "İzmir",
                        Country = "Türkiye",
                        DateOfBirth = new DateTime(1992, 7, 30, 0, 0, 0, DateTimeKind.Utc),
                        CreatedAt = DateTime.UtcNow
                    }
                };

                context.Customers.AddRange(customers);
                await context.SaveChangesAsync();
            }

            // Seed Sample Products
            if (!await context.Products.AnyAsync())
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

            // Seed Sample Reservations
            if (!await context.Reservations.AnyAsync())
            {
                var customers = await context.Customers.ToListAsync();
                var rooms = await context.Rooms.ToListAsync();

                if (customers.Any() && rooms.Any())
                {
                    var random = new Random();
                    var reservations = new List<Reservation>();

                    // Geçmiş rezervasyonlar (tamamlanmış)
                    for (int i = 0; i < 8; i++)
                    {
                        var customer = customers[random.Next(customers.Count)];
                        var room = rooms[random.Next(rooms.Count)];
                        var checkInDate = DateTime.UtcNow.Date.AddDays(-random.Next(30, 90));
                        var nights = random.Next(2, 7);
                        var checkOutDate = checkInDate.AddDays(nights);

                        reservations.Add(new Reservation
                        {
                            CustomerId = customer.Id,
                            RoomId = room.Id,
                            CheckInDate = checkInDate,
                            CheckOutDate = checkOutDate,
                            NumberOfGuests = random.Next(1, room.Capacity + 1),
                            TotalAmount = room.PricePerNight * nights,
                            PaidAmount = room.PricePerNight * nights,
                            Status = ReservationStatus.CheckedOut,
                            ActualCheckInDate = DateTime.SpecifyKind(checkInDate.AddHours(14), DateTimeKind.Utc),
                            ActualCheckOutDate = DateTime.SpecifyKind(checkOutDate.AddHours(11), DateTimeKind.Utc),
                            Notes = "Tamamlanmış rezervasyon",
                            CreatedAt = checkInDate.AddDays(-random.Next(1, 10))
                        });
                    }

                    // Mevcut rezervasyonlar (giriş yapılmış)
                    for (int i = 0; i < 3; i++)
                    {
                        var customer = customers[random.Next(customers.Count)];
                        var room = rooms[random.Next(rooms.Count)];
                        var checkInDate = DateTime.UtcNow.Date.AddDays(-random.Next(0, 3));
                        var nights = random.Next(3, 8);
                        var checkOutDate = checkInDate.AddDays(nights);

                        reservations.Add(new Reservation
                        {
                            CustomerId = customer.Id,
                            RoomId = room.Id,
                            CheckInDate = checkInDate,
                            CheckOutDate = checkOutDate,
                            NumberOfGuests = random.Next(1, room.Capacity + 1),
                            TotalAmount = room.PricePerNight * nights,
                            PaidAmount = room.PricePerNight * nights * 0.8m, // %80 ödendi
                            Status = ReservationStatus.CheckedIn,
                            ActualCheckInDate = DateTime.SpecifyKind(checkInDate.AddHours(14), DateTimeKind.Utc),
                            Notes = "Mevcut misafir",
                            CreatedAt = checkInDate.AddDays(-random.Next(5, 15))
                        });
                    }

                    // Gelecek rezervasyonlar (onaylanmış)
                    for (int i = 0; i < 5; i++)
                    {
                        var customer = customers[random.Next(customers.Count)];
                        var room = rooms[random.Next(rooms.Count)];
                        var checkInDate = DateTime.UtcNow.Date.AddDays(random.Next(1, 30));
                        var nights = random.Next(2, 10);
                        var checkOutDate = checkInDate.AddDays(nights);

                        reservations.Add(new Reservation
                        {
                            CustomerId = customer.Id,
                            RoomId = room.Id,
                            CheckInDate = checkInDate,
                            CheckOutDate = checkOutDate,
                            NumberOfGuests = random.Next(1, room.Capacity + 1),
                            TotalAmount = room.PricePerNight * nights,
                            PaidAmount = room.PricePerNight * nights * 0.5m, // %50 kapora
                            Status = ReservationStatus.Confirmed,
                            Notes = "Gelecek rezervasyon",
                            CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 20))
                        });
                    }

                    // Bekleyen rezervasyonlar
                    for (int i = 0; i < 2; i++)
                    {
                        var customer = customers[random.Next(customers.Count)];
                        var room = rooms[random.Next(rooms.Count)];
                        var checkInDate = DateTime.UtcNow.Date.AddDays(random.Next(5, 20));
                        var nights = random.Next(2, 5);
                        var checkOutDate = checkInDate.AddDays(nights);

                        reservations.Add(new Reservation
                        {
                            CustomerId = customer.Id,
                            RoomId = room.Id,
                            CheckInDate = checkInDate,
                            CheckOutDate = checkOutDate,
                            NumberOfGuests = random.Next(1, room.Capacity + 1),
                            TotalAmount = room.PricePerNight * nights,
                            PaidAmount = 0,
                            Status = ReservationStatus.Pending,
                            Notes = "Onay bekleyen rezervasyon",
                            CreatedAt = DateTime.UtcNow.AddDays(-random.Next(1, 5))
                        });
                    }

                    context.Reservations.AddRange(reservations);
                    await context.SaveChangesAsync();
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
