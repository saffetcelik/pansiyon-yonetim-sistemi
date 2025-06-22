using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IFinancialReportService
    {
        // Daily Reports
        Task<DailyFinancialReportDto> GetDailyReportAsync(DateTime date);
        Task<decimal> GetDailyRevenueAsync(DateTime date);
        Task<decimal> GetDailyExpensesAsync(DateTime date);
        Task<decimal> GetDailyProfitAsync(DateTime date);

        // Monthly Reports
        Task<MonthlyFinancialReportDto> GetMonthlyReportAsync(int year, int month);
        Task<decimal> GetMonthlyRevenueAsync(int year, int month);
        Task<decimal> GetMonthlyExpensesAsync(int year, int month);
        Task<decimal> GetMonthlyProfitAsync(int year, int month);

        // Period Reports
        Task<PeriodFinancialReportDto> GetPeriodReportAsync(DateTime startDate, DateTime endDate);

        // Cash Flow
        Task<CashFlowReportDto> GetCashFlowReportAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetCurrentCashBalanceAsync();

        // Payment Method Analysis
        Task<PaymentMethodReportDto> GetPaymentMethodReportAsync(DateTime startDate, DateTime endDate);

        // Category Analysis
        Task<ExpenseCategoryReportDto> GetExpenseCategoryReportAsync(DateTime startDate, DateTime endDate);
        Task<RevenueCategoryReportDto> GetRevenueCategoryReportAsync(DateTime startDate, DateTime endDate);

        // Trends
        Task<List<DailyTrendDto>> GetDailyTrendsAsync(DateTime startDate, DateTime endDate);
        Task<List<MonthlyTrendDto>> GetMonthlyTrendsAsync(int year);
    }

    // Report DTOs
    public class DailyFinancialReportDto
    {
        public DateTime Date { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal CashRevenue { get; set; }
        public decimal CardRevenue { get; set; }
        public decimal TransferRevenue { get; set; }
        public int ReservationCount { get; set; }
        public int SaleCount { get; set; }
        public int PaymentCount { get; set; }
        public int ExpenseCount { get; set; }
        public List<TopExpenseCategoryDto> TopExpenseCategories { get; set; } = new();
    }

    public class MonthlyFinancialReportDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal AverageDaily { get; set; }
        public int TotalDays { get; set; }
        public List<DailyTrendDto> DailyBreakdown { get; set; } = new();
        public List<TopExpenseCategoryDto> ExpenseBreakdown { get; set; } = new();
    }

    public class PeriodFinancialReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TotalDays { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal AverageDaily { get; set; }
        public PaymentMethodReportDto PaymentMethods { get; set; } = new();
        public ExpenseCategoryReportDto ExpenseCategories { get; set; } = new();
        public RevenueCategoryReportDto RevenueCategories { get; set; } = new();
    }

    public class CashFlowReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal TotalInflow { get; set; }
        public decimal TotalOutflow { get; set; }
        public decimal ClosingBalance { get; set; }
        public List<CashFlowItemDto> Inflows { get; set; } = new();
        public List<CashFlowItemDto> Outflows { get; set; } = new();
    }

    public class PaymentMethodReportDto
    {
        public decimal CashAmount { get; set; }
        public decimal CardAmount { get; set; }
        public decimal TransferAmount { get; set; }
        public int CashCount { get; set; }
        public int CardCount { get; set; }
        public int TransferCount { get; set; }
        public decimal CashPercentage { get; set; }
        public decimal CardPercentage { get; set; }
        public decimal TransferPercentage { get; set; }
    }

    public class ExpenseCategoryReportDto
    {
        public List<TopExpenseCategoryDto> Categories { get; set; } = new();
        public decimal TotalAmount { get; set; }
    }

    public class RevenueCategoryReportDto
    {
        public decimal ReservationRevenue { get; set; }
        public decimal SaleRevenue { get; set; }
        public decimal DepositRevenue { get; set; }
        public decimal OtherRevenue { get; set; }
        public int ReservationCount { get; set; }
        public int SaleCount { get; set; }
        public int DepositCount { get; set; }
        public int OtherCount { get; set; }
    }

    public class DailyTrendDto
    {
        public DateTime Date { get; set; }
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal Profit { get; set; }
    }

    public class MonthlyTrendDto
    {
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal Expenses { get; set; }
        public decimal Profit { get; set; }
    }

    public class TopExpenseCategoryDto
    {
        public ExpenseCategory Category { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }

    public class CashFlowItemDto
    {
        public DateTime Date { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }
}
