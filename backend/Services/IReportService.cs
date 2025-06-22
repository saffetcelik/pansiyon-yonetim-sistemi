using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IReportService
    {
        // Occupancy Reports
        Task<OccupancyReportDto> GetOccupancyReportAsync(DateTime startDate, DateTime endDate);
        Task<decimal> GetOccupancyRateAsync(DateTime date);
        Task<List<DailyOccupancyDto>> GetDailyOccupancyTrendsAsync(DateTime startDate, DateTime endDate);
        Task<MonthlyOccupancyDto> GetMonthlyOccupancyAsync(int year, int month);

        // Customer Reports
        Task<CustomerStatisticsDto> GetCustomerStatisticsAsync(DateTime startDate, DateTime endDate);
        Task<List<TopCustomerDto>> GetTopCustomersAsync(DateTime startDate, DateTime endDate, int count = 10);
        Task<CustomerDemographicsDto> GetCustomerDemographicsAsync(DateTime startDate, DateTime endDate);
        Task<List<CustomerRetentionDto>> GetCustomerRetentionAsync(int year);

        // Revenue Reports
        Task<RevenueReportDto> GetRevenueReportAsync(DateTime startDate, DateTime endDate);
        Task<List<DailyRevenueDto>> GetDailyRevenueTrendsAsync(DateTime startDate, DateTime endDate);
        Task<MonthlyRevenueDto> GetMonthlyRevenueAsync(int year, int month);
        Task<RevenueBySourceDto> GetRevenueBySourceAsync(DateTime startDate, DateTime endDate);

        // Room Reports
        Task<RoomPerformanceDto> GetRoomPerformanceAsync(DateTime startDate, DateTime endDate);
        Task<List<RoomUtilizationDto>> GetRoomUtilizationAsync(DateTime startDate, DateTime endDate);
        Task<RoomTypeAnalysisDto> GetRoomTypeAnalysisAsync(DateTime startDate, DateTime endDate);

        // Comprehensive Reports
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(DateTime date);
        Task<MonthlyBusinessReportDto> GetMonthlyBusinessReportAsync(int year, int month);
        Task<YearlyBusinessReportDto> GetYearlyBusinessReportAsync(int year);

        // Export Functions
        Task<byte[]> ExportReportToExcelAsync(string reportType, DateTime startDate, DateTime endDate);
        Task<byte[]> ExportReportToPdfAsync(string reportType, DateTime startDate, DateTime endDate);
    }

    // Report DTOs
    public class OccupancyReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal AverageOccupancyRate { get; set; }
        public int TotalRoomNights { get; set; }
        public int OccupiedRoomNights { get; set; }
        public int TotalRooms { get; set; }
        public List<DailyOccupancyDto> DailyBreakdown { get; set; } = new();
        public List<RoomTypeOccupancyDto> RoomTypeBreakdown { get; set; } = new();
    }

    public class DailyOccupancyDto
    {
        public DateTime Date { get; set; }
        public decimal OccupancyRate { get; set; }
        public int OccupiedRooms { get; set; }
        public int TotalRooms { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageRoomRate { get; set; }
    }

    public class MonthlyOccupancyDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal AverageOccupancyRate { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalReservations { get; set; }
        public List<DailyOccupancyDto> DailyBreakdown { get; set; } = new();
    }

    public class RoomTypeOccupancyDto
    {
        public string RoomType { get; set; } = string.Empty;
        public decimal OccupancyRate { get; set; }
        public int TotalRooms { get; set; }
        public int OccupiedNights { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageRate { get; set; }
    }

    public class CustomerStatisticsDto
    {
        public int TotalCustomers { get; set; }
        public int NewCustomers { get; set; }
        public int ReturningCustomers { get; set; }
        public decimal NewCustomerPercentage { get; set; }
        public decimal ReturningCustomerPercentage { get; set; }
        public decimal AverageStayDuration { get; set; }
        public decimal AverageSpendingPerCustomer { get; set; }
        public CustomerDemographicsDto Demographics { get; set; } = new();
        public List<TopCustomerDto> TopCustomers { get; set; } = new();
    }

    public class TopCustomerDto
    {
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int TotalReservations { get; set; }
        public decimal TotalSpending { get; set; }
        public int TotalNights { get; set; }
        public DateTime LastVisit { get; set; }
        public string CustomerType { get; set; } = string.Empty; // VIP, Regular, New
    }

    public class CustomerDemographicsDto
    {
        public Dictionary<string, int> CountryBreakdown { get; set; } = new();
        public Dictionary<string, int> CityBreakdown { get; set; } = new();
        public Dictionary<string, int> AgeGroupBreakdown { get; set; } = new();
        public Dictionary<string, int> GenderBreakdown { get; set; } = new();
    }

    public class CustomerRetentionDto
    {
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public int NewCustomers { get; set; }
        public int ReturningCustomers { get; set; }
        public decimal RetentionRate { get; set; }
    }

    public class RevenueReportDto
    {
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal ReservationRevenue { get; set; }
        public decimal SaleRevenue { get; set; }
        public decimal OtherRevenue { get; set; }
        public decimal AverageDailyRevenue { get; set; }
        public decimal GrowthRate { get; set; }
        public RevenueBySourceDto RevenueBySource { get; set; } = new();
        public List<DailyRevenueDto> DailyBreakdown { get; set; } = new();
    }

    public class DailyRevenueDto
    {
        public DateTime Date { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal ReservationRevenue { get; set; }
        public decimal SaleRevenue { get; set; }
        public decimal OtherRevenue { get; set; }
        public int ReservationCount { get; set; }
        public int SaleCount { get; set; }
    }

    public class MonthlyRevenueDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal TotalRevenue { get; set; }
        public decimal GrowthRate { get; set; }
        public List<DailyRevenueDto> DailyBreakdown { get; set; } = new();
    }

    public class RevenueBySourceDto
    {
        public decimal CashRevenue { get; set; }
        public decimal CardRevenue { get; set; }
        public decimal TransferRevenue { get; set; }
        public decimal CashPercentage { get; set; }
        public decimal CardPercentage { get; set; }
        public decimal TransferPercentage { get; set; }
    }

    public class RoomPerformanceDto
    {
        public List<RoomUtilizationDto> RoomUtilization { get; set; } = new();
        public RoomTypeAnalysisDto RoomTypeAnalysis { get; set; } = new();
        public decimal AverageRoomRate { get; set; }
        public decimal RevenuePAR { get; set; } // Revenue Per Available Room
    }

    public class RoomUtilizationDto
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public decimal UtilizationRate { get; set; }
        public int TotalNights { get; set; }
        public int OccupiedNights { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageRate { get; set; }
    }

    public class RoomTypeAnalysisDto
    {
        public Dictionary<string, RoomTypeStatsDto> RoomTypeStats { get; set; } = new();
    }

    public class RoomTypeStatsDto
    {
        public int TotalRooms { get; set; }
        public decimal OccupancyRate { get; set; }
        public decimal Revenue { get; set; }
        public decimal AverageRate { get; set; }
        public int TotalReservations { get; set; }
    }

    public class DashboardSummaryDto
    {
        public DateTime Date { get; set; }
        public decimal TodayRevenue { get; set; }
        public decimal MonthRevenue { get; set; }
        public decimal YearRevenue { get; set; }
        public decimal TodayOccupancy { get; set; }
        public decimal MonthOccupancy { get; set; }
        public int TotalReservations { get; set; }
        public int CheckInsToday { get; set; }
        public int CheckOutsToday { get; set; }
        public int AvailableRooms { get; set; }
        public List<RecentActivityDto> RecentActivities { get; set; } = new();
        public List<UpcomingReservationDto> UpcomingReservations { get; set; } = new();
    }

    public class RecentActivityDto
    {
        public DateTime Timestamp { get; set; }
        public string Activity { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
    }

    public class UpcomingReservationDto
    {
        public int ReservationId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int Nights { get; set; }
        public decimal TotalAmount { get; set; }
    }

    public class MonthlyBusinessReportDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public MonthlyRevenueDto Revenue { get; set; } = new();
        public MonthlyOccupancyDto Occupancy { get; set; } = new();
        public CustomerStatisticsDto CustomerStats { get; set; } = new();
        public ExpenseSummaryDto Expenses { get; set; } = new();
        public decimal NetProfit { get; set; }
        public decimal ProfitMargin { get; set; }
    }

    public class YearlyBusinessReportDto
    {
        public int Year { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalExpenses { get; set; }
        public decimal NetProfit { get; set; }
        public decimal AverageOccupancy { get; set; }
        public int TotalReservations { get; set; }
        public int TotalCustomers { get; set; }
        public List<MonthlyBusinessTrendDto> MonthlyTrends { get; set; } = new();
        public CustomerStatisticsDto YearlyCustomerStats { get; set; } = new();
    }

    public class MonthlyBusinessTrendDto
    {
        public int Month { get; set; }
        public string MonthName { get; set; } = string.Empty;
        public decimal Revenue { get; set; }
        public decimal OccupancyRate { get; set; }
        public int Reservations { get; set; }
    }


}
