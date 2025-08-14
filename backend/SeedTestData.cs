using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API
{
    public static class SeedTestData
    {
        public static async Task SeedReportingDataAsync(ApplicationDbContext context)
        {
            // Test verileri üretim ortamında oluşturulmayacak
            Console.WriteLine("Test data seeding disabled for production.");
            return;

#pragma warning disable CS0162 // Unreachable code detected
            // Add sample reservations
            var reservations = new List<Reservation>
            {
                new Reservation
                {
                    CustomerId = 1, RoomId = 1, CheckInDate = DateTime.Parse("2025-06-15"), CheckOutDate = DateTime.Parse("2025-06-18"),
                    NumberOfGuests = 1, TotalAmount = 450.00m, PaidAmount = 450.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Completed reservation", CreatedAt = DateTime.Parse("2025-06-15 10:00:00"), UpdatedAt = DateTime.Parse("2025-06-18 12:00:00")
                },
                new Reservation
                {
                    CustomerId = 2, RoomId = 2, CheckInDate = DateTime.Parse("2025-06-16"), CheckOutDate = DateTime.Parse("2025-06-20"),
                    NumberOfGuests = 1, TotalAmount = 600.00m, PaidAmount = 600.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Completed reservation", CreatedAt = DateTime.Parse("2025-06-16 14:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 11:00:00")
                },
                new Reservation
                {
                    CustomerId = 3, RoomId = 6, CheckInDate = DateTime.Parse("2025-06-18"), CheckOutDate = DateTime.Parse("2025-06-22"),
                    NumberOfGuests = 2, TotalAmount = 800.00m, PaidAmount = 800.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Completed reservation", CreatedAt = DateTime.Parse("2025-06-18 15:00:00"), UpdatedAt = DateTime.Parse("2025-06-22 10:00:00")
                },
                new Reservation
                {
                    CustomerId = 4, RoomId = 7, CheckInDate = DateTime.Parse("2025-06-20"), CheckOutDate = DateTime.Parse("2025-06-23"),
                    NumberOfGuests = 2, TotalAmount = 600.00m, PaidAmount = 600.00m, Status = ReservationStatus.CheckedIn,
                    Notes = "Current guest", CreatedAt = DateTime.Parse("2025-06-20 16:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 16:00:00")
                },
                new Reservation
                {
                    CustomerId = 5, RoomId = 11, CheckInDate = DateTime.Parse("2025-06-21"), CheckOutDate = DateTime.Parse("2025-06-25"),
                    NumberOfGuests = 3, TotalAmount = 1000.00m, PaidAmount = 500.00m, Status = ReservationStatus.CheckedIn,
                    Notes = "Current guest", CreatedAt = DateTime.Parse("2025-06-21 13:00:00"), UpdatedAt = DateTime.Parse("2025-06-21 13:00:00")
                },
                new Reservation
                {
                    CustomerId = 1, RoomId = 3, CheckInDate = DateTime.Parse("2025-06-10"), CheckOutDate = DateTime.Parse("2025-06-13"),
                    NumberOfGuests = 1, TotalAmount = 450.00m, PaidAmount = 450.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Previous stay", CreatedAt = DateTime.Parse("2025-06-10 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-13 11:00:00")
                },
                new Reservation
                {
                    CustomerId = 6, RoomId = 8, CheckInDate = DateTime.Parse("2025-06-12"), CheckOutDate = DateTime.Parse("2025-06-15"),
                    NumberOfGuests = 2, TotalAmount = 600.00m, PaidAmount = 600.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Completed reservation", CreatedAt = DateTime.Parse("2025-06-12 12:00:00"), UpdatedAt = DateTime.Parse("2025-06-15 10:00:00")
                },
                new Reservation
                {
                    CustomerId = 7, RoomId = 14, CheckInDate = DateTime.Parse("2025-06-14"), CheckOutDate = DateTime.Parse("2025-06-17"),
                    NumberOfGuests = 4, TotalAmount = 900.00m, PaidAmount = 900.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Family stay", CreatedAt = DateTime.Parse("2025-06-14 14:00:00"), UpdatedAt = DateTime.Parse("2025-06-17 12:00:00")
                },
                new Reservation
                {
                    CustomerId = 8, RoomId = 9, CheckInDate = DateTime.Parse("2025-06-05"), CheckOutDate = DateTime.Parse("2025-06-08"),
                    NumberOfGuests = 2, TotalAmount = 600.00m, PaidAmount = 600.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Early June stay", CreatedAt = DateTime.Parse("2025-06-05 15:00:00"), UpdatedAt = DateTime.Parse("2025-06-08 11:00:00")
                },
                new Reservation
                {
                    CustomerId = 2, RoomId = 12, CheckInDate = DateTime.Parse("2025-06-08"), CheckOutDate = DateTime.Parse("2025-06-11"),
                    NumberOfGuests = 3, TotalAmount = 750.00m, PaidAmount = 750.00m, Status = ReservationStatus.CheckedOut,
                    Notes = "Triple room stay", CreatedAt = DateTime.Parse("2025-06-08 16:00:00"), UpdatedAt = DateTime.Parse("2025-06-11 10:00:00")
                }
            };

            context.Reservations.AddRange(reservations);
            await context.SaveChangesAsync();

            // Get the added reservation IDs
            var addedReservations = await context.Reservations
                .Where(r => r.CheckInDate >= DateTime.Parse("2025-06-05"))
                .OrderBy(r => r.CheckInDate)
                .ToListAsync();

            // Add sample payments
            var payments = new List<Payment>
            {
                new Payment { ReservationId = addedReservations[8].Id, CustomerId = 1, Amount = 450.00m, Method = PaymentMethod.Cash, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-15 10:30:00"), Description = "Room payment - 001", Reference = "PAY-001", CreatedAt = DateTime.Parse("2025-06-15 10:30:00"), UpdatedAt = DateTime.Parse("2025-06-15 10:30:00") },
                new Payment { ReservationId = addedReservations[1].Id, CustomerId = 2, Amount = 600.00m, Method = PaymentMethod.Card, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-16 14:30:00"), Description = "Room payment - 002", Reference = "PAY-002", CreatedAt = DateTime.Parse("2025-06-16 14:30:00"), UpdatedAt = DateTime.Parse("2025-06-16 14:30:00") },
                new Payment { ReservationId = addedReservations[2].Id, CustomerId = 3, Amount = 800.00m, Method = PaymentMethod.Transfer, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-18 15:30:00"), Description = "Room payment - 006", Reference = "PAY-003", CreatedAt = DateTime.Parse("2025-06-18 15:30:00"), UpdatedAt = DateTime.Parse("2025-06-18 15:30:00") },
                new Payment { ReservationId = addedReservations[3].Id, CustomerId = 4, Amount = 600.00m, Method = PaymentMethod.Cash, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-20 16:30:00"), Description = "Room payment - 007", Reference = "PAY-004", CreatedAt = DateTime.Parse("2025-06-20 16:30:00"), UpdatedAt = DateTime.Parse("2025-06-20 16:30:00") },
                new Payment { ReservationId = addedReservations[4].Id, CustomerId = 5, Amount = 500.00m, Method = PaymentMethod.Card, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-21 13:30:00"), Description = "Partial payment - 011", Reference = "PAY-005", CreatedAt = DateTime.Parse("2025-06-21 13:30:00"), UpdatedAt = DateTime.Parse("2025-06-21 13:30:00") },
                new Payment { ReservationId = addedReservations[5].Id, CustomerId = 1, Amount = 450.00m, Method = PaymentMethod.Cash, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-10 09:30:00"), Description = "Room payment - 003", Reference = "PAY-006", CreatedAt = DateTime.Parse("2025-06-10 09:30:00"), UpdatedAt = DateTime.Parse("2025-06-10 09:30:00") },
                new Payment { ReservationId = addedReservations[6].Id, CustomerId = 6, Amount = 600.00m, Method = PaymentMethod.Card, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-12 12:30:00"), Description = "Room payment - 008", Reference = "PAY-007", CreatedAt = DateTime.Parse("2025-06-12 12:30:00"), UpdatedAt = DateTime.Parse("2025-06-12 12:30:00") },
                new Payment { ReservationId = addedReservations[7].Id, CustomerId = 7, Amount = 900.00m, Method = PaymentMethod.Transfer, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-14 14:30:00"), Description = "Room payment - 014", Reference = "PAY-008", CreatedAt = DateTime.Parse("2025-06-14 14:30:00"), UpdatedAt = DateTime.Parse("2025-06-14 14:30:00") },
                new Payment { ReservationId = addedReservations[8].Id, CustomerId = 8, Amount = 600.00m, Method = PaymentMethod.Cash, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-05 15:30:00"), Description = "Room payment - 009", Reference = "PAY-009", CreatedAt = DateTime.Parse("2025-06-05 15:30:00"), UpdatedAt = DateTime.Parse("2025-06-05 15:30:00") },
                new Payment { ReservationId = addedReservations[9].Id, CustomerId = 2, Amount = 750.00m, Method = PaymentMethod.Card, Type = PaymentType.Reservation, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-08 16:30:00"), Description = "Room payment - 012", Reference = "PAY-010", CreatedAt = DateTime.Parse("2025-06-08 16:30:00"), UpdatedAt = DateTime.Parse("2025-06-08 16:30:00") },
                
                // Sales payments
                new Payment { ReservationId = null, CustomerId = 1, Amount = 25.50m, Method = PaymentMethod.Cash, Type = PaymentType.Sale, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-15 18:00:00"), Description = "Minibar sales", Reference = "SALE-001", CreatedAt = DateTime.Parse("2025-06-15 18:00:00"), UpdatedAt = DateTime.Parse("2025-06-15 18:00:00") },
                new Payment { ReservationId = null, CustomerId = 2, Amount = 45.00m, Method = PaymentMethod.Cash, Type = PaymentType.Sale, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-16 20:00:00"), Description = "Restaurant sales", Reference = "SALE-002", CreatedAt = DateTime.Parse("2025-06-16 20:00:00"), UpdatedAt = DateTime.Parse("2025-06-16 20:00:00") },
                new Payment { ReservationId = null, CustomerId = 3, Amount = 35.75m, Method = PaymentMethod.Card, Type = PaymentType.Sale, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-18 19:30:00"), Description = "Beverage sales", Reference = "SALE-003", CreatedAt = DateTime.Parse("2025-06-18 19:30:00"), UpdatedAt = DateTime.Parse("2025-06-18 19:30:00") },
                new Payment { ReservationId = null, CustomerId = 4, Amount = 60.00m, Method = PaymentMethod.Cash, Type = PaymentType.Sale, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-20 21:00:00"), Description = "Dinner sales", Reference = "SALE-004", CreatedAt = DateTime.Parse("2025-06-20 21:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 21:00:00") },
                new Payment { ReservationId = null, CustomerId = 5, Amount = 28.25m, Method = PaymentMethod.Card, Type = PaymentType.Sale, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-21 17:45:00"), Description = "Snack sales", Reference = "SALE-005", CreatedAt = DateTime.Parse("2025-06-21 17:45:00"), UpdatedAt = DateTime.Parse("2025-06-21 17:45:00") },
                
                // Service payments
                new Payment { ReservationId = null, CustomerId = 1, Amount = 15.00m, Method = PaymentMethod.Cash, Type = PaymentType.Other, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-10 14:00:00"), Description = "Laundry service", Reference = "SRV-001", CreatedAt = DateTime.Parse("2025-06-10 14:00:00"), UpdatedAt = DateTime.Parse("2025-06-10 14:00:00") },
                new Payment { ReservationId = null, CustomerId = 6, Amount = 30.00m, Method = PaymentMethod.Card, Type = PaymentType.Other, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-12 16:00:00"), Description = "Room service", Reference = "SRV-002", CreatedAt = DateTime.Parse("2025-06-12 16:00:00"), UpdatedAt = DateTime.Parse("2025-06-12 16:00:00") },
                new Payment { ReservationId = null, CustomerId = 7, Amount = 50.00m, Method = PaymentMethod.Transfer, Type = PaymentType.Other, Status = PaymentStatus.Completed, PaymentDate = DateTime.Parse("2025-06-14 18:00:00"), Description = "Spa service", Reference = "SRV-003", CreatedAt = DateTime.Parse("2025-06-14 18:00:00"), UpdatedAt = DateTime.Parse("2025-06-14 18:00:00") }
            };

            context.Payments.AddRange(payments);
            await context.SaveChangesAsync();

            // Add sample expenses
            var expenses = new List<Expense>
            {
                new Expense { ExpenseNumber = "EXP-2025-001", Title = "Electricity Bill", Description = "Monthly electricity bill for June 2025", Amount = 1250.00m, Category = ExpenseCategory.Utilities, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-30"), PaymentDate = DateTime.Parse("2025-06-22"), Vendor = "TEDAŞ", InvoiceNumber = "ELC-2025-06", CreatedAt = DateTime.Parse("2025-06-01 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-22 10:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-002", Title = "Water Bill", Description = "Monthly water bill for June 2025", Amount = 450.00m, Category = ExpenseCategory.Utilities, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-28"), PaymentDate = DateTime.Parse("2025-06-20"), Vendor = "ASAT", InvoiceNumber = "WTR-2025-06", CreatedAt = DateTime.Parse("2025-06-01 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 11:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-003", Title = "Internet Service", Description = "Monthly internet and phone service", Amount = 350.00m, Category = ExpenseCategory.Utilities, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-25"), PaymentDate = DateTime.Parse("2025-06-18"), Vendor = "Türk Telekom", InvoiceNumber = "INT-2025-06", CreatedAt = DateTime.Parse("2025-06-01 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-18 14:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-004", Title = "Cleaning Supplies", Description = "Monthly cleaning supplies purchase", Amount = 850.00m, Category = ExpenseCategory.Supplies, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-15"), PaymentDate = DateTime.Parse("2025-06-15"), Vendor = "Temizlik A.Ş.", InvoiceNumber = "CLN-2025-06", CreatedAt = DateTime.Parse("2025-06-10 10:00:00"), UpdatedAt = DateTime.Parse("2025-06-15 15:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-005", Title = "Food & Beverage", Description = "Restaurant supplies for June", Amount = 2500.00m, Category = ExpenseCategory.Supplies, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-20"), PaymentDate = DateTime.Parse("2025-06-19"), Vendor = "Gıda Tedarik Ltd.", InvoiceNumber = "FNB-2025-06", CreatedAt = DateTime.Parse("2025-06-12 11:00:00"), UpdatedAt = DateTime.Parse("2025-06-19 16:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-006", Title = "Maintenance Service", Description = "Air conditioning maintenance", Amount = 750.00m, Category = ExpenseCategory.Maintenance, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-10"), PaymentDate = DateTime.Parse("2025-06-10"), Vendor = "Klima Servis", InvoiceNumber = "MNT-2025-06", CreatedAt = DateTime.Parse("2025-06-05 12:00:00"), UpdatedAt = DateTime.Parse("2025-06-10 17:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-007", Title = "Staff Salaries", Description = "Monthly staff salaries for June", Amount = 15000.00m, Category = ExpenseCategory.Staff, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-30"), PaymentDate = DateTime.Parse("2025-06-30"), Vendor = "Internal", InvoiceNumber = "SAL-2025-06", CreatedAt = DateTime.Parse("2025-06-01 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-30 18:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-008", Title = "Insurance Premium", Description = "Monthly insurance premium", Amount = 1200.00m, Category = ExpenseCategory.Insurance, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-25"), PaymentDate = DateTime.Parse("2025-06-22"), Vendor = "Sigorta A.Ş.", InvoiceNumber = "INS-2025-06", CreatedAt = DateTime.Parse("2025-06-01 09:00:00"), UpdatedAt = DateTime.Parse("2025-06-22 12:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-009", Title = "Marketing Campaign", Description = "Social media advertising", Amount = 500.00m, Category = ExpenseCategory.Marketing, Status = ExpenseStatus.Paid, DueDate = DateTime.Parse("2025-06-15"), PaymentDate = DateTime.Parse("2025-06-14"), Vendor = "Dijital Ajans", InvoiceNumber = "MKT-2025-06", CreatedAt = DateTime.Parse("2025-06-08 13:00:00"), UpdatedAt = DateTime.Parse("2025-06-14 19:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-010", Title = "Office Supplies", Description = "Monthly office supplies", Amount = 300.00m, Category = ExpenseCategory.Other, Status = ExpenseStatus.Pending, DueDate = DateTime.Parse("2025-06-30"), PaymentDate = null, Vendor = "Ofis Malzeme", InvoiceNumber = "OFC-2025-06", CreatedAt = DateTime.Parse("2025-06-20 14:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 14:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-011", Title = "Equipment Repair", Description = "Washing machine repair", Amount = 450.00m, Category = ExpenseCategory.Maintenance, Status = ExpenseStatus.Pending, DueDate = DateTime.Parse("2025-06-28"), PaymentDate = null, Vendor = "Beyaz Eşya Servis", InvoiceNumber = "RPR-2025-06", CreatedAt = DateTime.Parse("2025-06-22 15:00:00"), UpdatedAt = DateTime.Parse("2025-06-22 15:00:00") },
                new Expense { ExpenseNumber = "EXP-2025-012", Title = "Legal Consultation", Description = "Monthly legal consultation fee", Amount = 800.00m, Category = ExpenseCategory.Insurance, Status = ExpenseStatus.Pending, DueDate = DateTime.Parse("2025-07-01"), PaymentDate = null, Vendor = "Hukuk Bürosu", InvoiceNumber = "LGL-2025-06", CreatedAt = DateTime.Parse("2025-06-20 16:00:00"), UpdatedAt = DateTime.Parse("2025-06-20 16:00:00") }
            };

            context.Expenses.AddRange(expenses);
            await context.SaveChangesAsync();

            Console.WriteLine("Test data seeded successfully!");
#pragma warning restore CS0162 // Unreachable code detected
        }
    }
}
