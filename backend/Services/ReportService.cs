using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using System.Globalization;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using System;

namespace PansiyonYonetimSistemi.API.Services
{
    public class ReportService : IReportService
    {
        private readonly ApplicationDbContext _context;

        public ReportService(ApplicationDbContext context)
        {
            _context = context;
        }

        #region Occupancy Reports

        public async Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime startDate, DateTime endDate)
        {
            var totalRooms = await _context.Rooms.CountAsync();
            var totalDays = (endDate - startDate).Days + 1;
            var totalRoomNights = totalRooms * totalDays;

            // Get all reservations in the date range
            var reservations = await _context.Reservations
                .Where(r => r.CheckInDate <= endDate && r.CheckOutDate >= startDate && 
                           r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut)
                .ToListAsync();

            // Calculate occupied room nights
            var occupiedRoomNights = 0;
            foreach (var reservation in reservations)
            {
                var checkIn = reservation.CheckInDate > startDate ? reservation.CheckInDate : startDate;
                var checkOut = reservation.CheckOutDate < endDate ? reservation.CheckOutDate : endDate;
                
                if (checkOut > checkIn)
                {
                    occupiedRoomNights += (checkOut - checkIn).Days;
                }
            }

            var occupancyRate = totalRoomNights > 0 ? (decimal)occupiedRoomNights / totalRoomNights * 100 : 0;

            // Get daily breakdown
            var dailyBreakdown = await GetDailyOccupancyTrendsAsync(startDate, endDate);

            // Get room type breakdown
            var roomTypeBreakdown = await GetRoomTypeOccupancyAsync(startDate, endDate);

            return new OccupancyReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                AverageOccupancyRate = occupancyRate,
                TotalRoomNights = totalRoomNights,
                OccupiedRoomNights = occupiedRoomNights,
                TotalRooms = totalRooms,
                DailyBreakdown = dailyBreakdown,
                RoomTypeBreakdown = roomTypeBreakdown
            };
        }

        public async Task<decimal> GetOccupancyRateAsync(DateTime date)
        {
            var totalRooms = await _context.Rooms.CountAsync();
            
            var occupiedRooms = await _context.Reservations
                .Where(r => r.CheckInDate <= date && r.CheckOutDate > date && 
                           (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                .CountAsync();

            return totalRooms > 0 ? (decimal)occupiedRooms / totalRooms * 100 : 0;
        }

        public async Task<List<DailyOccupancyDto>> GetDailyOccupancyTrendsAsync(DateTime startDate, DateTime endDate)
        {
            var trends = new List<DailyOccupancyDto>();
            var totalRooms = await _context.Rooms.CountAsync();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                var occupiedRooms = await _context.Reservations
                    .Where(r => r.CheckInDate <= currentDate && r.CheckOutDate > currentDate && 
                               (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                    .CountAsync();

                var occupancyRate = totalRooms > 0 ? (decimal)occupiedRooms / totalRooms * 100 : 0;

                // Get revenue for the day
                var dayStart = currentDate;
                var dayEnd = currentDate.AddDays(1);
                var dayRevenue = await _context.Payments
                    .Where(p => p.PaymentDate >= dayStart && p.PaymentDate < dayEnd && 
                               p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                    .SumAsync(p => p.Amount);

                var averageRoomRate = occupiedRooms > 0 ? dayRevenue / occupiedRooms : 0;

                trends.Add(new DailyOccupancyDto
                {
                    Date = currentDate,
                    OccupancyRate = occupancyRate,
                    OccupiedRooms = occupiedRooms,
                    TotalRooms = totalRooms,
                    Revenue = dayRevenue,
                    AverageRoomRate = averageRoomRate
                });

                currentDate = currentDate.AddDays(1);
            }

            return trends;
        }

        public async Task<MonthlyOccupancyDto> GetMonthlyOccupancyAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var occupancyReport = await GetOccupancyReportAsync(startDate, endDate.AddDays(-1));
            var dailyBreakdown = await GetDailyOccupancyTrendsAsync(startDate, endDate.AddDays(-1));

            var totalRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && 
                           p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                .SumAsync(p => p.Amount);

            var totalReservations = await _context.Reservations
                .Where(r => r.CheckInDate >= startDate && r.CheckInDate < endDate)
                .CountAsync();

            return new MonthlyOccupancyDto
            {
                Year = year,
                Month = month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                AverageOccupancyRate = occupancyReport.AverageOccupancyRate,
                TotalRevenue = totalRevenue,
                TotalReservations = totalReservations,
                DailyBreakdown = dailyBreakdown
            };
        }

        private async Task<List<RoomTypeOccupancyDto>> GetRoomTypeOccupancyAsync(DateTime startDate, DateTime endDate)
        {
            var roomTypes = await _context.Rooms
                .GroupBy(r => new { r.Capacity, r.HasSeaView, r.HasBalcony })
                .Select(g => new
                {
                    RoomType = $"{g.Key.Capacity} kişilik" + 
                              (g.Key.HasSeaView ? " - Deniz Manzaralı" : "") + 
                              (g.Key.HasBalcony ? " - Balkonlu" : ""),
                    TotalRooms = g.Count(),
                    RoomIds = g.Select(r => r.Id).ToList()
                })
                .ToListAsync();

            var result = new List<RoomTypeOccupancyDto>();

            foreach (var roomType in roomTypes)
            {
                var totalDays = (endDate - startDate).Days + 1;
                var totalRoomNights = roomType.TotalRooms * totalDays;

                var occupiedNights = await _context.Reservations
                    .Where(r => roomType.RoomIds.Contains(r.RoomId) &&
                               r.CheckInDate <= endDate && r.CheckOutDate >= startDate &&
                               (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                    .SumAsync(r => Math.Min((r.CheckOutDate < endDate ? r.CheckOutDate : endDate).Subtract(
                                          r.CheckInDate > startDate ? r.CheckInDate : startDate).Days, totalDays));

                var revenue = await _context.Payments
                    .Where(p => p.ReservationId.HasValue &&
                               _context.Reservations.Any(r => r.Id == p.ReservationId && roomType.RoomIds.Contains(r.RoomId)) &&
                               p.PaymentDate >= startDate && p.PaymentDate <= endDate &&
                               p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                    .SumAsync(p => p.Amount);

                var occupancyRate = totalRoomNights > 0 ? (decimal)occupiedNights / totalRoomNights * 100 : 0;
                var averageRate = occupiedNights > 0 ? revenue / occupiedNights : 0;

                result.Add(new RoomTypeOccupancyDto
                {
                    RoomType = roomType.RoomType,
                    OccupancyRate = occupancyRate,
                    TotalRooms = roomType.TotalRooms,
                    OccupiedNights = occupiedNights,
                    Revenue = revenue,
                    AverageRate = averageRate
                });
            }

            return result;
        }

        #endregion

        #region Customer Reports

        public async Task<CustomerStatisticsDto> GetCustomerStatisticsAsync(DateTime startDate, DateTime endDate)
        {
            var allCustomers = await _context.Customers
                .Include(c => c.Reservations)
                .ToListAsync();

            var customersInPeriod = allCustomers
                .Where(c => c.Reservations.Any(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate))
                .ToList();

            var newCustomers = customersInPeriod
                .Where(c => c.CreatedAt >= startDate && c.CreatedAt <= endDate)
                .ToList();

            var returningCustomers = customersInPeriod
                .Where(c => c.CreatedAt < startDate)
                .ToList();

            var totalCustomers = customersInPeriod.Count;
            var newCustomerCount = newCustomers.Count;
            var returningCustomerCount = returningCustomers.Count;

            // Calculate average stay duration
            var reservationsInPeriod = await _context.Reservations
                .Where(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate)
                .ToListAsync();

            var averageStayDuration = reservationsInPeriod.Any() 
                ? reservationsInPeriod.Average(r => (r.CheckOutDate - r.CheckInDate).Days) 
                : 0;

            // Calculate average spending per customer
            var totalSpending = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && 
                           p.Status == PaymentStatus.Completed && p.CustomerId.HasValue)
                .SumAsync(p => p.Amount);

            var averageSpendingPerCustomer = totalCustomers > 0 ? totalSpending / totalCustomers : 0;

            // Get demographics
            var demographics = await GetCustomerDemographicsAsync(startDate, endDate);

            // Get top customers
            var topCustomers = await GetTopCustomersAsync(startDate, endDate, 5);

            return new CustomerStatisticsDto
            {
                TotalCustomers = totalCustomers,
                NewCustomers = newCustomerCount,
                ReturningCustomers = returningCustomerCount,
                NewCustomerPercentage = totalCustomers > 0 ? (decimal)newCustomerCount / totalCustomers * 100 : 0,
                ReturningCustomerPercentage = totalCustomers > 0 ? (decimal)returningCustomerCount / totalCustomers * 100 : 0,
                AverageStayDuration = (decimal)averageStayDuration,
                AverageSpendingPerCustomer = averageSpendingPerCustomer,
                Demographics = demographics,
                TopCustomers = topCustomers
            };
        }

        // Continue with more methods...
        public async Task<List<TopCustomerDto>> GetTopCustomersAsync(DateTime startDate, DateTime endDate, int count = 10)
        {
            var customerStats = await _context.Customers
                .Where(c => c.Reservations.Any(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate))
                .Select(c => new
                {
                    Customer = c,
                    TotalReservations = c.Reservations.Count(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate),
                    TotalSpending = _context.Payments
                        .Where(p => p.CustomerId == c.Id && p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                        .Sum(p => p.Amount),
                    TotalNights = c.Reservations
                        .Where(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate)
                        .Sum(r => (r.CheckOutDate - r.CheckInDate).Days),
                    LastVisit = c.Reservations
                        .Where(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate)
                        .Max(r => r.CheckInDate)
                })
                .OrderByDescending(x => x.TotalSpending)
                .Take(count)
                .ToListAsync();

            return customerStats.Select(cs => new TopCustomerDto
            {
                CustomerId = cs.Customer.Id,
                CustomerName = $"{cs.Customer.FirstName} {cs.Customer.LastName}",
                TotalReservations = cs.TotalReservations,
                TotalSpending = cs.TotalSpending,
                TotalNights = cs.TotalNights,
                LastVisit = cs.LastVisit,
                CustomerType = DetermineCustomerType(cs.TotalSpending, cs.TotalReservations)
            }).ToList();
        }

        private static string DetermineCustomerType(decimal totalSpending, int totalReservations)
        {
            if (totalSpending > 10000 || totalReservations > 5)
                return "VIP";
            else if (totalReservations > 1)
                return "Regular";
            else
                return "New";
        }

        public async Task<CustomerDemographicsDto> GetCustomerDemographicsAsync(DateTime startDate, DateTime endDate)
        {
            var customers = await _context.Customers
                .Where(c => c.Reservations.Any(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate))
                .ToListAsync();

            var countryBreakdown = customers
                .Where(c => !string.IsNullOrEmpty(c.Country))
                .GroupBy(c => c.Country)
                .ToDictionary(g => g.Key!, g => g.Count());

            var cityBreakdown = customers
                .Where(c => !string.IsNullOrEmpty(c.City))
                .GroupBy(c => c.City)
                .ToDictionary(g => g.Key!, g => g.Count());

            // Gender field doesn't exist in Customer model, skip for now
            var genderBreakdown = new Dictionary<string, int>();

            // Age group calculation
            var ageGroupBreakdown = customers
                .Where(c => c.DateOfBirth.HasValue)
                .Select(c => CalculateAgeGroup(c.DateOfBirth!.Value))
                .GroupBy(age => age)
                .ToDictionary(g => g.Key, g => g.Count());

            return new CustomerDemographicsDto
            {
                CountryBreakdown = countryBreakdown,
                CityBreakdown = cityBreakdown,
                AgeGroupBreakdown = ageGroupBreakdown,
                GenderBreakdown = genderBreakdown
            };
        }

        private static string CalculateAgeGroup(DateTime dateOfBirth)
        {
            var age = DateTime.Today.Year - dateOfBirth.Year;
            if (dateOfBirth.Date > DateTime.Today.AddYears(-age)) age--;

            return age switch
            {
                < 25 => "18-24",
                < 35 => "25-34",
                < 45 => "35-44",
                < 55 => "45-54",
                < 65 => "55-64",
                _ => "65+"
            };
        }

        public async Task<List<CustomerRetentionDto>> GetCustomerRetentionAsync(int year)
        {
            var retention = new List<CustomerRetentionDto>();

            for (int month = 1; month <= 12; month++)
            {
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1);

                var newCustomers = await _context.Customers
                    .Where(c => c.CreatedAt >= startDate && c.CreatedAt < endDate)
                    .CountAsync();

                var returningCustomers = await _context.Customers
                    .Where(c => c.CreatedAt < startDate && 
                               c.Reservations.Any(r => r.CheckInDate >= startDate && r.CheckInDate < endDate))
                    .CountAsync();

                var totalCustomers = newCustomers + returningCustomers;
                var retentionRate = totalCustomers > 0 ? (decimal)returningCustomers / totalCustomers * 100 : 0;

                retention.Add(new CustomerRetentionDto
                {
                    Month = month,
                    MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                    NewCustomers = newCustomers,
                    ReturningCustomers = returningCustomers,
                    RetentionRate = retentionRate
                });
            }

            return retention;
        }

        #endregion

        #region Revenue Reports

        public async Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.Amount);
            var reservationRevenue = payments.Where(p => p.Type == PaymentType.Reservation).Sum(p => p.Amount);
            var saleRevenue = payments.Where(p => p.Type == PaymentType.Sale).Sum(p => p.Amount);
            var otherRevenue = payments.Where(p => p.Type == PaymentType.Other || p.Type == PaymentType.Deposit).Sum(p => p.Amount);

            var totalDays = (endDate - startDate).Days + 1;
            var averageDailyRevenue = totalDays > 0 ? totalRevenue / totalDays : 0;

            // Calculate growth rate (compare with previous period)
            var previousStartDate = startDate.AddDays(-totalDays);
            var previousEndDate = startDate.AddDays(-1);
            var previousRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= previousStartDate && p.PaymentDate <= previousEndDate && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var growthRate = previousRevenue > 0 ? (totalRevenue - previousRevenue) / previousRevenue * 100 : 0;

            var revenueBySource = await GetRevenueBySourceAsync(startDate, endDate);
            var dailyBreakdown = await GetDailyRevenueTrendsAsync(startDate, endDate);

            return new RevenueReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalRevenue = totalRevenue,
                ReservationRevenue = reservationRevenue,
                SaleRevenue = saleRevenue,
                OtherRevenue = otherRevenue,
                AverageDailyRevenue = averageDailyRevenue,
                GrowthRate = growthRate,
                RevenueBySource = revenueBySource,
                DailyBreakdown = dailyBreakdown
            };
        }

        public async Task<List<DailyRevenueDto>> GetDailyRevenueTrendsAsync(DateTime startDate, DateTime endDate)
        {
            var trends = new List<DailyRevenueDto>();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                var dayStart = currentDate;
                var dayEnd = currentDate.AddDays(1);

                var dayPayments = await _context.Payments
                    .Where(p => p.PaymentDate >= dayStart && p.PaymentDate < dayEnd && p.Status == PaymentStatus.Completed)
                    .ToListAsync();

                var totalRevenue = dayPayments.Sum(p => p.Amount);
                var reservationRevenue = dayPayments.Where(p => p.Type == PaymentType.Reservation).Sum(p => p.Amount);
                var saleRevenue = dayPayments.Where(p => p.Type == PaymentType.Sale).Sum(p => p.Amount);
                var otherRevenue = dayPayments.Where(p => p.Type == PaymentType.Other || p.Type == PaymentType.Deposit).Sum(p => p.Amount);

                var reservationCount = dayPayments.Count(p => p.Type == PaymentType.Reservation);
                var saleCount = dayPayments.Count(p => p.Type == PaymentType.Sale);

                trends.Add(new DailyRevenueDto
                {
                    Date = currentDate,
                    TotalRevenue = totalRevenue,
                    ReservationRevenue = reservationRevenue,
                    SaleRevenue = saleRevenue,
                    OtherRevenue = otherRevenue,
                    ReservationCount = reservationCount,
                    SaleCount = saleCount
                });

                currentDate = currentDate.AddDays(1);
            }

            return trends;
        }

        public async Task<MonthlyRevenueDto> GetMonthlyRevenueAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            var monthlyRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            // Calculate growth rate compared to previous month
            var previousMonth = startDate.AddMonths(-1);
            var previousMonthEnd = startDate;
            var previousMonthRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= previousMonth && p.PaymentDate < previousMonthEnd && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var growthRate = previousMonthRevenue > 0 ? (monthlyRevenue - previousMonthRevenue) / previousMonthRevenue * 100 : 0;

            var dailyBreakdown = await GetDailyRevenueTrendsAsync(startDate, endDate.AddDays(-1));

            return new MonthlyRevenueDto
            {
                Year = year,
                Month = month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                TotalRevenue = monthlyRevenue,
                GrowthRate = growthRate,
                DailyBreakdown = dailyBreakdown
            };
        }

        public async Task<RevenueBySourceDto> GetRevenueBySourceAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.Amount);
            var cashRevenue = payments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount);
            var cardRevenue = payments.Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount);
            var transferRevenue = payments.Where(p => p.Method == PaymentMethod.Transfer).Sum(p => p.Amount);

            return new RevenueBySourceDto
            {
                CashRevenue = cashRevenue,
                CardRevenue = cardRevenue,
                TransferRevenue = transferRevenue,
                CashPercentage = totalRevenue > 0 ? cashRevenue / totalRevenue * 100 : 0,
                CardPercentage = totalRevenue > 0 ? cardRevenue / totalRevenue * 100 : 0,
                TransferPercentage = totalRevenue > 0 ? transferRevenue / totalRevenue * 100 : 0
            };
        }

        #endregion

        #region Room Reports

        public async Task<RoomPerformanceDto> GetRoomPerformanceAsync(DateTime startDate, DateTime endDate)
        {
            var roomUtilization = await GetRoomUtilizationAsync(startDate, endDate);
            var roomTypeAnalysis = await GetRoomTypeAnalysisAsync(startDate, endDate);

            // Calculate average room rate and RevPAR
            var totalRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate &&
                           p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                .SumAsync(p => p.Amount);

            var totalRoomNights = await _context.Reservations
                .Where(r => r.CheckInDate >= startDate && r.CheckInDate <= endDate)
                .SumAsync(r => (r.CheckOutDate - r.CheckInDate).Days);

            var totalRooms = await _context.Rooms.CountAsync();
            var totalDays = (endDate - startDate).Days + 1;
            var totalAvailableRoomNights = totalRooms * totalDays;

            var averageRoomRate = totalRoomNights > 0 ? totalRevenue / totalRoomNights : 0;
            var revenuePAR = totalAvailableRoomNights > 0 ? totalRevenue / totalAvailableRoomNights : 0;

            return new RoomPerformanceDto
            {
                RoomUtilization = roomUtilization,
                RoomTypeAnalysis = roomTypeAnalysis,
                AverageRoomRate = averageRoomRate,
                RevenuePAR = revenuePAR
            };
        }

        public async Task<List<RoomUtilizationDto>> GetRoomUtilizationAsync(DateTime startDate, DateTime endDate)
        {
            var rooms = await _context.Rooms.ToListAsync();
            var utilization = new List<RoomUtilizationDto>();

            foreach (var room in rooms)
            {
                var totalDays = (endDate - startDate).Days + 1;

                var occupiedNights = await _context.Reservations
                    .Where(r => r.RoomId == room.Id &&
                               r.CheckInDate <= endDate && r.CheckOutDate >= startDate &&
                               (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                    .SumAsync(r => Math.Min((r.CheckOutDate < endDate ? r.CheckOutDate : endDate).Subtract(
                                          r.CheckInDate > startDate ? r.CheckInDate : startDate).Days, totalDays));

                var revenue = await _context.Payments
                    .Where(p => p.ReservationId.HasValue &&
                               _context.Reservations.Any(r => r.Id == p.ReservationId && r.RoomId == room.Id) &&
                               p.PaymentDate >= startDate && p.PaymentDate <= endDate &&
                               p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                    .SumAsync(p => p.Amount);

                var utilizationRate = totalDays > 0 ? (decimal)occupiedNights / totalDays * 100 : 0;
                var averageRate = occupiedNights > 0 ? revenue / occupiedNights : 0;

                utilization.Add(new RoomUtilizationDto
                {
                    RoomId = room.Id,
                    RoomNumber = room.RoomNumber,
                    UtilizationRate = utilizationRate,
                    TotalNights = totalDays,
                    OccupiedNights = occupiedNights,
                    Revenue = revenue,
                    AverageRate = averageRate
                });
            }

            return utilization.OrderByDescending(u => u.UtilizationRate).ToList();
        }

        public async Task<RoomTypeAnalysisDto> GetRoomTypeAnalysisAsync(DateTime startDate, DateTime endDate)
        {
            var roomTypes = await _context.Rooms
                .GroupBy(r => new { r.Capacity, r.HasSeaView, r.HasBalcony })
                .Select(g => new
                {
                    RoomType = $"{g.Key.Capacity} kişilik" +
                              (g.Key.HasSeaView ? " - Deniz Manzaralı" : "") +
                              (g.Key.HasBalcony ? " - Balkonlu" : ""),
                    TotalRooms = g.Count(),
                    RoomIds = g.Select(r => r.Id).ToList()
                })
                .ToListAsync();

            var roomTypeStats = new Dictionary<string, RoomTypeStatsDto>();

            foreach (var roomType in roomTypes)
            {
                var totalDays = (endDate - startDate).Days + 1;
                var totalRoomNights = roomType.TotalRooms * totalDays;

                var occupiedNights = await _context.Reservations
                    .Where(r => roomType.RoomIds.Contains(r.RoomId) &&
                               r.CheckInDate <= endDate && r.CheckOutDate >= startDate &&
                               (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                    .SumAsync(r => Math.Min((r.CheckOutDate < endDate ? r.CheckOutDate : endDate).Subtract(
                                          r.CheckInDate > startDate ? r.CheckInDate : startDate).Days, totalDays));

                var revenue = await _context.Payments
                    .Where(p => p.ReservationId.HasValue &&
                               _context.Reservations.Any(r => r.Id == p.ReservationId && roomType.RoomIds.Contains(r.RoomId)) &&
                               p.PaymentDate >= startDate && p.PaymentDate <= endDate &&
                               p.Status == PaymentStatus.Completed && p.Type == PaymentType.Reservation)
                    .SumAsync(p => p.Amount);

                var totalReservations = await _context.Reservations
                    .Where(r => roomType.RoomIds.Contains(r.RoomId) &&
                               r.CheckInDate >= startDate && r.CheckInDate <= endDate)
                    .CountAsync();

                var occupancyRate = totalRoomNights > 0 ? (decimal)occupiedNights / totalRoomNights * 100 : 0;
                var averageRate = occupiedNights > 0 ? revenue / occupiedNights : 0;

                roomTypeStats[roomType.RoomType] = new RoomTypeStatsDto
                {
                    TotalRooms = roomType.TotalRooms,
                    OccupancyRate = occupancyRate,
                    Revenue = revenue,
                    AverageRate = averageRate,
                    TotalReservations = totalReservations
                };
            }

            return new RoomTypeAnalysisDto
            {
                RoomTypeStats = roomTypeStats
            };
        }

        #endregion

        #region Dashboard and Business Reports

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime date)
        {
            var startOfDay = date.Date;
            var endOfDay = startOfDay.AddDays(1);
            var startOfMonth = new DateTime(date.Year, date.Month, 1);
            var endOfMonth = startOfMonth.AddMonths(1);
            var startOfYear = new DateTime(date.Year, 1, 1);
            var endOfYear = startOfYear.AddYears(1);

            // Today's revenue
            var todayRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startOfDay && p.PaymentDate < endOfDay && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            // Month revenue
            var monthRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startOfMonth && p.PaymentDate < endOfMonth && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            // Year revenue
            var yearRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startOfYear && p.PaymentDate < endOfYear && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            // Today's occupancy
            var todayOccupancy = await GetOccupancyRateAsync(date);

            // Month occupancy - calculate directly to avoid circular dependency
            var monthStartDate = new DateTime(date.Year, date.Month, 1);
            var monthEndDate = monthStartDate.AddMonths(1);
            var totalRoomsForMonth = await _context.Rooms.CountAsync();
            var totalDaysInMonth = (monthEndDate.AddDays(-1) - monthStartDate).Days + 1;
            var totalRoomNightsInMonth = totalRoomsForMonth * totalDaysInMonth;

            var occupiedRoomNightsInMonth = await _context.Reservations
                .Where(r => r.CheckInDate <= monthEndDate.AddDays(-1) && r.CheckOutDate >= monthStartDate &&
                           (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                .SumAsync(r => Math.Min((r.CheckOutDate < monthEndDate ? r.CheckOutDate : monthEndDate).Subtract(
                                      r.CheckInDate > monthStartDate ? r.CheckInDate : monthStartDate).Days, totalDaysInMonth));

            var monthOccupancyRate = totalRoomNightsInMonth > 0 ? (decimal)occupiedRoomNightsInMonth / totalRoomNightsInMonth * 100 : 0;

            // Available rooms
            var totalRooms = await _context.Rooms.CountAsync();
            var occupiedRooms = await _context.Reservations
                .Where(r => r.CheckInDate <= date && r.CheckOutDate > date &&
                           (r.Status == ReservationStatus.CheckedIn || r.Status == ReservationStatus.CheckedOut))
                .CountAsync();
            var availableRooms = totalRooms - occupiedRooms;

            // Total reservations
            var totalReservations = await _context.Reservations.CountAsync();

            // Check-ins and check-outs today
            var checkInsToday = await _context.Reservations
                .Where(r => r.CheckInDate.Date == date.Date)
                .CountAsync();

            var checkOutsToday = await _context.Reservations
                .Where(r => r.CheckOutDate.Date == date.Date)
                .CountAsync();

            // Recent activities (placeholder - would need a proper activity log)
            var recentActivities = new List<RecentActivityDto>();

            // Upcoming reservations
            var upcomingReservations = await _context.Reservations
                .Include(r => r.Customer)
                .Include(r => r.Room)
                .Where(r => r.CheckInDate >= date && r.CheckInDate <= date.AddDays(7))
                .OrderBy(r => r.CheckInDate)
                .Take(5)
                .Select(r => new UpcomingReservationDto
                {
                    ReservationId = r.Id,
                    CustomerName = $"{r.Customer.FirstName} {r.Customer.LastName}",
                    RoomNumber = r.Room.RoomNumber,
                    CheckInDate = r.CheckInDate,
                    CheckOutDate = r.CheckOutDate,
                    Nights = (r.CheckOutDate - r.CheckInDate).Days,
                    TotalAmount = r.TotalAmount
                })
                .ToListAsync();

            return new DashboardSummaryDto
            {
                Date = date,
                TodayRevenue = todayRevenue,
                MonthRevenue = monthRevenue,
                YearRevenue = yearRevenue,
                TodayOccupancy = todayOccupancy,
                MonthOccupancy = monthOccupancyRate,
                TotalReservations = totalReservations,
                CheckInsToday = checkInsToday,
                CheckOutsToday = checkOutsToday,
                AvailableRooms = availableRooms,
                RecentActivities = recentActivities,
                UpcomingReservations = upcomingReservations
            };
        }

        public async Task<MonthlyBusinessReportDto> GetMonthlyBusinessReportAsync(int year, int month)
        {
            var monthlyRevenue = await GetMonthlyRevenueAsync(year, month);
            var monthlyOccupancy = await GetMonthlyOccupancyAsync(year, month);
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);
            var customerStats = await GetCustomerStatisticsAsync(startDate, endDate.AddDays(-1));

            // Get expenses for the month (placeholder - would need expense data)
            var expenses = new ExpenseSummaryDto
            {
                TotalAmount = 0,
                Date = startDate
            };

            var netProfit = monthlyRevenue.TotalRevenue - expenses.TotalAmount;
            var profitMargin = monthlyRevenue.TotalRevenue > 0 ? netProfit / monthlyRevenue.TotalRevenue * 100 : 0;

            return new MonthlyBusinessReportDto
            {
                Year = year,
                Month = month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                Revenue = monthlyRevenue,
                Occupancy = monthlyOccupancy,
                CustomerStats = customerStats,
                Expenses = expenses,
                NetProfit = netProfit,
                ProfitMargin = profitMargin
            };
        }

        public async Task<YearlyBusinessReportDto> GetYearlyBusinessReportAsync(int year)
        {
            var startDate = new DateTime(year, 1, 1);
            var endDate = startDate.AddYears(1);

            var totalRevenue = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var totalExpenses = 0m; // Placeholder - would need expense data

            var netProfit = totalRevenue - totalExpenses;

            // Calculate average occupancy for the year
            var monthlyOccupancies = new List<decimal>();
            for (int month = 1; month <= 12; month++)
            {
                var monthOccupancy = await GetMonthlyOccupancyAsync(year, month);
                monthlyOccupancies.Add(monthOccupancy.AverageOccupancyRate);
            }
            var averageOccupancy = monthlyOccupancies.Average();

            var totalReservations = await _context.Reservations
                .Where(r => r.CheckInDate >= startDate && r.CheckInDate < endDate)
                .CountAsync();

            var totalCustomers = await _context.Customers
                .Where(c => c.Reservations.Any(r => r.CheckInDate >= startDate && r.CheckInDate < endDate))
                .CountAsync();

            var monthlyTrends = await GetMonthlyTrendsAsync(year);
            var yearlyCustomerStats = await GetCustomerStatisticsAsync(startDate, endDate.AddDays(-1));

            return new YearlyBusinessReportDto
            {
                Year = year,
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                NetProfit = netProfit,
                AverageOccupancy = averageOccupancy,
                TotalReservations = totalReservations,
                TotalCustomers = totalCustomers,
                MonthlyTrends = monthlyTrends,
                YearlyCustomerStats = yearlyCustomerStats
            };
        }

        private async Task<List<MonthlyBusinessTrendDto>> GetMonthlyTrendsAsync(int year)
        {
            var trends = new List<MonthlyBusinessTrendDto>();

            for (int month = 1; month <= 12; month++)
            {
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1);

                var monthRevenue = await _context.Payments
                    .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                    .SumAsync(p => p.Amount);

                var monthOccupancy = await GetMonthlyOccupancyAsync(year, month);

                var monthReservations = await _context.Reservations
                    .Where(r => r.CheckInDate >= startDate && r.CheckInDate < endDate)
                    .CountAsync();

                trends.Add(new MonthlyBusinessTrendDto
                {
                    Month = month,
                    MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                    Revenue = monthRevenue,
                    OccupancyRate = monthOccupancy.AverageOccupancyRate,
                    Reservations = monthReservations
                });
            }

            return trends;
        }

        #endregion

        #region Export Functions

        public async Task<byte[]> ExportReportToExcelAsync(string reportType, DateTime startDate, DateTime endDate)
        {
            // Set EPPlus license for non-commercial use (compatible with all versions)
            // Daha eski EPPlus sürümleri için (8'den öncesi)
            try
            {
                ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"EPPlus eski lisans modu hatası: {ex.Message}");
                // Yeni sürümler için alternatif
                try 
                {
                    var licenseContext = Type.GetType("OfficeOpenXml.LicenseContext")?.GetField("NonCommercial");
                    var licenseProperty = typeof(ExcelPackage).GetProperty("License");
                    
                    if (licenseProperty != null && licenseContext != null)
                    {
                        var licenseValue = licenseContext.GetValue(null);
                        var packageLicense = licenseProperty.GetValue(null);
                        
                        var contextProperty = packageLicense?.GetType().GetProperty("LicenseContext");
                        if (contextProperty != null)
                        {
                            contextProperty.SetValue(packageLicense, licenseValue);
                        }
                    }
                }
                catch (Exception reflectionEx)
                {
                    Console.WriteLine($"EPPlus lisans ayarı yapılamadı: {reflectionEx.Message}");
                }
            }

            using var package = new ExcelPackage();

            switch (reportType.ToLower())
            {
                case "occupancy":
                    await CreateOccupancyExcelReport(package, startDate, endDate);
                    break;
                case "revenue":
                    await CreateRevenueExcelReport(package, startDate, endDate);
                    break;
                case "customer":
                    await CreateCustomerExcelReport(package, startDate, endDate);
                    break;
                default:
                    await CreateComprehensiveExcelReport(package, startDate, endDate);
                    break;
            }

            return package.GetAsByteArray();
        }

        private async Task CreateOccupancyExcelReport(ExcelPackage package, DateTime startDate, DateTime endDate)
        {
            var worksheet = package.Workbook.Worksheets.Add("Doluluk Raporu");
            var occupancyReport = await GetOccupancyReportAsync(startDate, endDate);

            // Header
            worksheet.Cells[1, 1].Value = "DOLULUK RAPORU";
            worksheet.Cells[1, 1, 1, 6].Merge = true;
            worksheet.Cells[1, 1].Style.Font.Size = 16;
            worksheet.Cells[1, 1].Style.Font.Bold = true;
            worksheet.Cells[1, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            worksheet.Cells[2, 1].Value = $"Tarih Aralığı: {startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy}";
            worksheet.Cells[2, 1, 2, 6].Merge = true;
            worksheet.Cells[2, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Summary
            int row = 4;
            worksheet.Cells[row, 1].Value = "Özet Bilgiler";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            row++;

            worksheet.Cells[row, 1].Value = "Ortalama Doluluk Oranı:";
            worksheet.Cells[row, 2].Value = $"%{occupancyReport.AverageOccupancyRate:F2}";
            row++;

            worksheet.Cells[row, 1].Value = "Toplam Oda Geceleri:";
            worksheet.Cells[row, 2].Value = occupancyReport.TotalRoomNights;
            row++;

            worksheet.Cells[row, 1].Value = "Dolu Oda Geceleri:";
            worksheet.Cells[row, 2].Value = occupancyReport.OccupiedRoomNights;
            row++;

            // Daily breakdown
            row += 2;
            worksheet.Cells[row, 1].Value = "Günlük Detay";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            row++;

            // Headers
            worksheet.Cells[row, 1].Value = "Tarih";
            worksheet.Cells[row, 2].Value = "Doluluk Oranı (%)";
            worksheet.Cells[row, 3].Value = "Dolu Oda";
            worksheet.Cells[row, 4].Value = "Toplam Oda";
            worksheet.Cells[row, 5].Value = "Gelir (₺)";
            worksheet.Cells[row, 6].Value = "Ort. Oda Fiyatı (₺)";

            // Style headers
            using (var range = worksheet.Cells[row, 1, row, 6])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
                range.Style.Border.BorderAround(OfficeOpenXml.Style.ExcelBorderStyle.Thin);
            }

            row++;

            // Data
            foreach (var daily in occupancyReport.DailyBreakdown)
            {
                worksheet.Cells[row, 1].Value = daily.Date.ToString("dd.MM.yyyy");
                worksheet.Cells[row, 2].Value = daily.OccupancyRate;
                worksheet.Cells[row, 3].Value = daily.OccupiedRooms;
                worksheet.Cells[row, 4].Value = daily.TotalRooms;
                worksheet.Cells[row, 5].Value = daily.Revenue;
                worksheet.Cells[row, 6].Value = daily.AverageRoomRate;

                // Format currency
                worksheet.Cells[row, 5].Style.Numberformat.Format = "#,##0.00";
                worksheet.Cells[row, 6].Style.Numberformat.Format = "#,##0.00";

                row++;
            }

            // Auto-fit columns
            worksheet.Cells.AutoFitColumns();
        }

        private async Task CreateRevenueExcelReport(ExcelPackage package, DateTime startDate, DateTime endDate)
        {
            var worksheet = package.Workbook.Worksheets.Add("Gelir Raporu");
            var revenueReport = await GetRevenueReportAsync(startDate, endDate);

            // Header
            worksheet.Cells[1, 1].Value = "GELİR RAPORU";
            worksheet.Cells[1, 1, 1, 5].Merge = true;
            worksheet.Cells[1, 1].Style.Font.Size = 16;
            worksheet.Cells[1, 1].Style.Font.Bold = true;
            worksheet.Cells[1, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            worksheet.Cells[2, 1].Value = $"Tarih Aralığı: {startDate:dd.MM.yyyy} - {endDate:dd.MM.yyyy}";
            worksheet.Cells[2, 1, 2, 5].Merge = true;
            worksheet.Cells[2, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Summary
            int row = 4;
            worksheet.Cells[row, 1].Value = "Özet Bilgiler";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            row++;

            worksheet.Cells[row, 1].Value = "Toplam Gelir:";
            worksheet.Cells[row, 2].Value = revenueReport.TotalRevenue;
            worksheet.Cells[row, 2].Style.Numberformat.Format = "#,##0.00 ₺";
            row++;

            worksheet.Cells[row, 1].Value = "Rezervasyon Geliri:";
            worksheet.Cells[row, 2].Value = revenueReport.ReservationRevenue;
            worksheet.Cells[row, 2].Style.Numberformat.Format = "#,##0.00 ₺";
            row++;

            worksheet.Cells[row, 1].Value = "Satış Geliri:";
            worksheet.Cells[row, 2].Value = revenueReport.SaleRevenue;
            worksheet.Cells[row, 2].Style.Numberformat.Format = "#,##0.00 ₺";
            row++;

            worksheet.Cells[row, 1].Value = "Günlük Ortalama:";
            worksheet.Cells[row, 2].Value = revenueReport.AverageDailyRevenue;
            worksheet.Cells[row, 2].Style.Numberformat.Format = "#,##0.00 ₺";
            row++;

            worksheet.Cells[row, 1].Value = "Büyüme Oranı:";
            worksheet.Cells[row, 2].Value = revenueReport.GrowthRate;
            worksheet.Cells[row, 2].Style.Numberformat.Format = "0.00%";
            row++;

            // Daily breakdown
            row += 2;
            worksheet.Cells[row, 1].Value = "Günlük Detay";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            row++;

            // Headers
            worksheet.Cells[row, 1].Value = "Tarih";
            worksheet.Cells[row, 2].Value = "Toplam Gelir";
            worksheet.Cells[row, 3].Value = "Rezervasyon";
            worksheet.Cells[row, 4].Value = "Satış";
            worksheet.Cells[row, 5].Value = "Diğer";

            // Style headers
            using (var range = worksheet.Cells[row, 1, row, 5])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
                range.Style.Border.BorderAround(OfficeOpenXml.Style.ExcelBorderStyle.Thin);
            }

            row++;

            // Data
            foreach (var daily in revenueReport.DailyBreakdown)
            {
                worksheet.Cells[row, 1].Value = daily.Date.ToString("dd.MM.yyyy");
                worksheet.Cells[row, 2].Value = daily.TotalRevenue;
                worksheet.Cells[row, 3].Value = daily.ReservationRevenue;
                worksheet.Cells[row, 4].Value = daily.SaleRevenue;
                worksheet.Cells[row, 5].Value = daily.OtherRevenue;

                // Format currency
                for (int col = 2; col <= 5; col++)
                {
                    worksheet.Cells[row, col].Style.Numberformat.Format = "#,##0.00";
                }

                row++;
            }

            worksheet.Cells.AutoFitColumns();
        }

        private async Task CreateCustomerExcelReport(ExcelPackage package, DateTime startDate, DateTime endDate)
        {
            var worksheet = package.Workbook.Worksheets.Add("Müşteri Raporu");
            var customerStats = await GetCustomerStatisticsAsync(startDate, endDate);

            // Header
            worksheet.Cells[1, 1].Value = "MÜŞTERİ RAPORU";
            worksheet.Cells[1, 1, 1, 4].Merge = true;
            worksheet.Cells[1, 1].Style.Font.Size = 16;
            worksheet.Cells[1, 1].Style.Font.Bold = true;
            worksheet.Cells[1, 1].Style.HorizontalAlignment = ExcelHorizontalAlignment.Center;

            // Summary
            int row = 3;
            worksheet.Cells[row, 1].Value = "Toplam Müşteri:";
            worksheet.Cells[row, 2].Value = customerStats.TotalCustomers;
            row++;

            worksheet.Cells[row, 1].Value = "Yeni Müşteri:";
            worksheet.Cells[row, 2].Value = customerStats.NewCustomers;
            row++;

            worksheet.Cells[row, 1].Value = "Geri Dönen Müşteri:";
            worksheet.Cells[row, 2].Value = customerStats.ReturningCustomers;
            row++;

            // Top customers
            row += 2;
            worksheet.Cells[row, 1].Value = "En Değerli Müşteriler";
            worksheet.Cells[row, 1].Style.Font.Bold = true;
            row++;

            worksheet.Cells[row, 1].Value = "Müşteri Adı";
            worksheet.Cells[row, 2].Value = "Rezervasyon Sayısı";
            worksheet.Cells[row, 3].Value = "Toplam Harcama";
            worksheet.Cells[row, 4].Value = "Müşteri Tipi";

            using (var range = worksheet.Cells[row, 1, row, 4])
            {
                range.Style.Font.Bold = true;
                range.Style.Fill.PatternType = OfficeOpenXml.Style.ExcelFillStyle.Solid;
                range.Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.LightGray);
            }

            row++;

            foreach (var customer in customerStats.TopCustomers)
            {
                worksheet.Cells[row, 1].Value = customer.CustomerName;
                worksheet.Cells[row, 2].Value = customer.TotalReservations;
                worksheet.Cells[row, 3].Value = customer.TotalSpending;
                worksheet.Cells[row, 4].Value = customer.CustomerType;

                worksheet.Cells[row, 3].Style.Numberformat.Format = "#,##0.00 ₺";
                row++;
            }

            worksheet.Cells.AutoFitColumns();
        }

        private async Task CreateComprehensiveExcelReport(ExcelPackage package, DateTime startDate, DateTime endDate)
        {
            // Create multiple worksheets for comprehensive report
            await CreateOccupancyExcelReport(package, startDate, endDate);
            await CreateRevenueExcelReport(package, startDate, endDate);
            await CreateCustomerExcelReport(package, startDate, endDate);
        }

        public Task<byte[]> ExportReportToPdfAsync(string reportType, DateTime startDate, DateTime endDate)
        {
            // PDF export implementation would go here
            // For now, return empty array as placeholder
            return Task.FromResult(new byte[0]);
        }

        #endregion
    }
}
