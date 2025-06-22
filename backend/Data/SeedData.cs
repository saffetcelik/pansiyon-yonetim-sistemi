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
