using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using System.Globalization;

namespace PansiyonYonetimSistemi.API.Services
{
    public class FinancialReportService : IFinancialReportService
    {
        private readonly ApplicationDbContext _context;

        public FinancialReportService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<DailyFinancialReportDto> GetDailyReportAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate && e.Status == ExpenseStatus.Paid)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.Amount);
            var totalExpenses = expenses.Sum(e => e.Amount);

            var expenseCategories = expenses
                .GroupBy(e => e.Category)
                .Select(g => new TopExpenseCategoryDto
                {
                    Category = g.Key,
                    CategoryName = GetExpenseCategoryName(g.Key),
                    Amount = g.Sum(e => e.Amount),
                    Count = g.Count(),
                    Percentage = totalExpenses > 0 ? (g.Sum(e => e.Amount) / totalExpenses) * 100 : 0
                })
                .OrderByDescending(c => c.Amount)
                .ToList();

            return new DailyFinancialReportDto
            {
                Date = date,
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                NetProfit = totalRevenue - totalExpenses,
                CashRevenue = payments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount),
                CardRevenue = payments.Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount),
                TransferRevenue = payments.Where(p => p.Method == PaymentMethod.Transfer).Sum(p => p.Amount),
                ReservationCount = payments.Count(p => p.Type == PaymentType.Reservation),
                SaleCount = payments.Count(p => p.Type == PaymentType.Sale),
                PaymentCount = payments.Count,
                ExpenseCount = expenses.Count,
                TopExpenseCategories = expenseCategories
            };
        }

        public async Task<decimal> GetDailyRevenueAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            return await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);
        }

        public async Task<decimal> GetDailyExpensesAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            return await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate && e.Status == ExpenseStatus.Paid)
                .SumAsync(e => e.Amount);
        }

        public async Task<decimal> GetDailyProfitAsync(DateTime date)
        {
            var revenue = await GetDailyRevenueAsync(date);
            var expenses = await GetDailyExpensesAsync(date);
            return revenue - expenses;
        }

        public async Task<MonthlyFinancialReportDto> GetMonthlyReportAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);
            var daysInMonth = DateTime.DaysInMonth(year, month);

            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate && e.Status == ExpenseStatus.Paid)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.Amount);
            var totalExpenses = expenses.Sum(e => e.Amount);

            // Daily breakdown
            var dailyBreakdown = new List<DailyTrendDto>();
            for (int day = 1; day <= daysInMonth; day++)
            {
                var currentDate = new DateTime(year, month, day);
                var dayStart = currentDate.Date;
                var dayEnd = dayStart.AddDays(1);

                var dayRevenue = payments.Where(p => p.PaymentDate >= dayStart && p.PaymentDate < dayEnd).Sum(p => p.Amount);
                var dayExpenses = expenses.Where(e => e.ExpenseDate >= dayStart && e.ExpenseDate < dayEnd).Sum(e => e.Amount);

                dailyBreakdown.Add(new DailyTrendDto
                {
                    Date = currentDate,
                    Revenue = dayRevenue,
                    Expenses = dayExpenses,
                    Profit = dayRevenue - dayExpenses
                });
            }

            // Expense breakdown
            var expenseBreakdown = expenses
                .GroupBy(e => e.Category)
                .Select(g => new TopExpenseCategoryDto
                {
                    Category = g.Key,
                    CategoryName = GetExpenseCategoryName(g.Key),
                    Amount = g.Sum(e => e.Amount),
                    Count = g.Count(),
                    Percentage = totalExpenses > 0 ? (g.Sum(e => e.Amount) / totalExpenses) * 100 : 0
                })
                .OrderByDescending(c => c.Amount)
                .ToList();

            return new MonthlyFinancialReportDto
            {
                Year = year,
                Month = month,
                MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                NetProfit = totalRevenue - totalExpenses,
                AverageDaily = (totalRevenue - totalExpenses) / daysInMonth,
                TotalDays = daysInMonth,
                DailyBreakdown = dailyBreakdown,
                ExpenseBreakdown = expenseBreakdown
            };
        }

        public async Task<decimal> GetMonthlyRevenueAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            return await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);
        }

        public async Task<decimal> GetMonthlyExpensesAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            return await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate && e.Status == ExpenseStatus.Paid)
                .SumAsync(e => e.Amount);
        }

        public async Task<decimal> GetMonthlyProfitAsync(int year, int month)
        {
            var revenue = await GetMonthlyRevenueAsync(year, month);
            var expenses = await GetMonthlyExpensesAsync(year, month);
            return revenue - expenses;
        }

        public async Task<PeriodFinancialReportDto> GetPeriodReportAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate <= endDate && e.Status == ExpenseStatus.Paid)
                .ToListAsync();

            var totalRevenue = payments.Sum(p => p.Amount);
            var totalExpenses = expenses.Sum(e => e.Amount);
            var totalDays = (endDate - startDate).Days + 1;

            return new PeriodFinancialReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                TotalDays = totalDays,
                TotalRevenue = totalRevenue,
                TotalExpenses = totalExpenses,
                NetProfit = totalRevenue - totalExpenses,
                AverageDaily = (totalRevenue - totalExpenses) / totalDays,
                PaymentMethods = await GetPaymentMethodReportAsync(startDate, endDate),
                ExpenseCategories = await GetExpenseCategoryReportAsync(startDate, endDate),
                RevenueCategories = await GetRevenueCategoryReportAsync(startDate, endDate)
            };
        }

        public async Task<CashFlowReportDto> GetCashFlowReportAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .OrderBy(p => p.PaymentDate)
                .ToListAsync();

            var expenses = await _context.Expenses
                .Where(e => e.PaymentDate >= startDate && e.PaymentDate <= endDate && e.Status == ExpenseStatus.Paid)
                .OrderBy(e => e.PaymentDate)
                .ToListAsync();

            var inflows = payments.Select(p => new CashFlowItemDto
            {
                Date = p.PaymentDate,
                Description = p.Description ?? $"{GetPaymentTypeName(p.Type)} - {p.PaymentNumber}",
                Amount = p.Amount,
                Type = "Gelir",
                Category = GetPaymentTypeName(p.Type)
            }).ToList();

            var outflows = expenses.Select(e => new CashFlowItemDto
            {
                Date = e.PaymentDate ?? e.ExpenseDate,
                Description = e.Title,
                Amount = e.Amount,
                Type = "Gider",
                Category = GetExpenseCategoryName(e.Category)
            }).ToList();

            var totalInflow = inflows.Sum(i => i.Amount);
            var totalOutflow = outflows.Sum(o => o.Amount);

            return new CashFlowReportDto
            {
                StartDate = startDate,
                EndDate = endDate,
                OpeningBalance = 0, // Bu değer ayrı bir sistem ile takip edilmeli
                TotalInflow = totalInflow,
                TotalOutflow = totalOutflow,
                ClosingBalance = totalInflow - totalOutflow,
                Inflows = inflows,
                Outflows = outflows
            };
        }

        public async Task<decimal> GetCurrentCashBalanceAsync()
        {
            var totalRevenue = await _context.Payments
                .Where(p => p.Status == PaymentStatus.Completed)
                .SumAsync(p => p.Amount);

            var totalExpenses = await _context.Expenses
                .Where(e => e.Status == ExpenseStatus.Paid)
                .SumAsync(e => e.Amount);

            return totalRevenue - totalExpenses;
        }

        public async Task<PaymentMethodReportDto> GetPaymentMethodReportAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            var totalAmount = payments.Sum(p => p.Amount);
            var cashAmount = payments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount);
            var cardAmount = payments.Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount);
            var transferAmount = payments.Where(p => p.Method == PaymentMethod.Transfer).Sum(p => p.Amount);

            return new PaymentMethodReportDto
            {
                CashAmount = cashAmount,
                CardAmount = cardAmount,
                TransferAmount = transferAmount,
                CashCount = payments.Count(p => p.Method == PaymentMethod.Cash),
                CardCount = payments.Count(p => p.Method == PaymentMethod.Card),
                TransferCount = payments.Count(p => p.Method == PaymentMethod.Transfer),
                CashPercentage = totalAmount > 0 ? (cashAmount / totalAmount) * 100 : 0,
                CardPercentage = totalAmount > 0 ? (cardAmount / totalAmount) * 100 : 0,
                TransferPercentage = totalAmount > 0 ? (transferAmount / totalAmount) * 100 : 0
            };
        }

        public async Task<ExpenseCategoryReportDto> GetExpenseCategoryReportAsync(DateTime startDate, DateTime endDate)
        {
            var expenses = await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate <= endDate && e.Status == ExpenseStatus.Paid)
                .ToListAsync();

            var totalAmount = expenses.Sum(e => e.Amount);

            var categories = expenses
                .GroupBy(e => e.Category)
                .Select(g => new TopExpenseCategoryDto
                {
                    Category = g.Key,
                    CategoryName = GetExpenseCategoryName(g.Key),
                    Amount = g.Sum(e => e.Amount),
                    Count = g.Count(),
                    Percentage = totalAmount > 0 ? (g.Sum(e => e.Amount) / totalAmount) * 100 : 0
                })
                .OrderByDescending(c => c.Amount)
                .ToList();

            return new ExpenseCategoryReportDto
            {
                Categories = categories,
                TotalAmount = totalAmount
            };
        }

        public async Task<RevenueCategoryReportDto> GetRevenueCategoryReportAsync(DateTime startDate, DateTime endDate)
        {
            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate <= endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            return new RevenueCategoryReportDto
            {
                ReservationRevenue = payments.Where(p => p.Type == PaymentType.Reservation).Sum(p => p.Amount),
                SaleRevenue = payments.Where(p => p.Type == PaymentType.Sale).Sum(p => p.Amount),
                DepositRevenue = payments.Where(p => p.Type == PaymentType.Deposit).Sum(p => p.Amount),
                OtherRevenue = payments.Where(p => p.Type == PaymentType.Other).Sum(p => p.Amount),
                ReservationCount = payments.Count(p => p.Type == PaymentType.Reservation),
                SaleCount = payments.Count(p => p.Type == PaymentType.Sale),
                DepositCount = payments.Count(p => p.Type == PaymentType.Deposit),
                OtherCount = payments.Count(p => p.Type == PaymentType.Other)
            };
        }

        public async Task<List<DailyTrendDto>> GetDailyTrendsAsync(DateTime startDate, DateTime endDate)
        {
            var trends = new List<DailyTrendDto>();
            var currentDate = startDate.Date;

            while (currentDate <= endDate.Date)
            {
                var dayStart = currentDate;
                var dayEnd = currentDate.AddDays(1);

                var revenue = await _context.Payments
                    .Where(p => p.PaymentDate >= dayStart && p.PaymentDate < dayEnd && p.Status == PaymentStatus.Completed)
                    .SumAsync(p => p.Amount);

                var expenses = await _context.Expenses
                    .Where(e => e.ExpenseDate >= dayStart && e.ExpenseDate < dayEnd && e.Status == ExpenseStatus.Paid)
                    .SumAsync(e => e.Amount);

                trends.Add(new DailyTrendDto
                {
                    Date = currentDate,
                    Revenue = revenue,
                    Expenses = expenses,
                    Profit = revenue - expenses
                });

                currentDate = currentDate.AddDays(1);
            }

            return trends;
        }

        public async Task<List<MonthlyTrendDto>> GetMonthlyTrendsAsync(int year)
        {
            var trends = new List<MonthlyTrendDto>();

            for (int month = 1; month <= 12; month++)
            {
                var startDate = new DateTime(year, month, 1);
                var endDate = startDate.AddMonths(1);

                var revenue = await _context.Payments
                    .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                    .SumAsync(p => p.Amount);

                var expenses = await _context.Expenses
                    .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate && e.Status == ExpenseStatus.Paid)
                    .SumAsync(e => e.Amount);

                trends.Add(new MonthlyTrendDto
                {
                    Month = month,
                    MonthName = CultureInfo.CurrentCulture.DateTimeFormat.GetMonthName(month),
                    Revenue = revenue,
                    Expenses = expenses,
                    Profit = revenue - expenses
                });
            }

            return trends;
        }

        private static string GetExpenseCategoryName(ExpenseCategory category)
        {
            return category switch
            {
                ExpenseCategory.Utilities => "Faturalar",
                ExpenseCategory.Maintenance => "Bakım-Onarım",
                ExpenseCategory.Supplies => "Malzeme",
                ExpenseCategory.Staff => "Personel",
                ExpenseCategory.Marketing => "Pazarlama",
                ExpenseCategory.Insurance => "Sigorta",
                ExpenseCategory.Tax => "Vergi",
                ExpenseCategory.Rent => "Kira",
                ExpenseCategory.Food => "Yiyecek-İçecek",
                ExpenseCategory.Cleaning => "Temizlik",
                ExpenseCategory.Other => "Diğer",
                _ => "Bilinmeyen"
            };
        }

        private static string GetPaymentTypeName(PaymentType type)
        {
            return type switch
            {
                PaymentType.Reservation => "Rezervasyon",
                PaymentType.Sale => "Satış",
                PaymentType.Deposit => "Depozito",
                PaymentType.Refund => "İade",
                PaymentType.Other => "Diğer",
                _ => "Bilinmeyen"
            };
        }
    }
}
