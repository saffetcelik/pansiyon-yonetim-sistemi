using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PansiyonYonetimSistemi.API.Services;
using PansiyonYonetimSistemi.API.Attributes;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/reports")]
    [Authorize]
    public class ReportController : ControllerBase
    {
        private readonly IReportService _reportService;

        public ReportController(IReportService reportService)
        {
            _reportService = reportService;
        }

        #region Occupancy Reports

        [HttpGet("occupancy")]
        [AllRoles]
        public async Task<IActionResult> GetOccupancyReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _reportService.GetOccupancyReportAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Doluluk raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("occupancy/rate")]
        [AllRoles]
        public async Task<IActionResult> GetOccupancyRate([FromQuery] DateTime date)
        {
            try
            {
                var rate = await _reportService.GetOccupancyRateAsync(date);
                return Ok(new { date, occupancyRate = rate });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Doluluk oranı alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("occupancy/trends")]
        [AllRoles]
        public async Task<IActionResult> GetDailyOccupancyTrends([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var trends = await _reportService.GetDailyOccupancyTrendsAsync(startDate, endDate);
                return Ok(trends);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Doluluk trendleri alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("occupancy/monthly")]
        [AllRoles]
        public async Task<IActionResult> GetMonthlyOccupancy([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var report = await _reportService.GetMonthlyOccupancyAsync(year, month);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Aylık doluluk raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        #endregion

        #region Customer Reports

        [HttpGet("customers/statistics")]
        [AdminOnly]
        public async Task<IActionResult> GetCustomerStatistics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var stats = await _reportService.GetCustomerStatisticsAsync(startDate, endDate);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri istatistikleri alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("customers/top")]
        [AdminOnly]
        public async Task<IActionResult> GetTopCustomers([FromQuery] DateTime startDate, [FromQuery] DateTime endDate, [FromQuery] int count = 10)
        {
            try
            {
                var topCustomers = await _reportService.GetTopCustomersAsync(startDate, endDate, count);
                return Ok(topCustomers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "En değerli müşteriler alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("customers/demographics")]
        [AdminOnly]
        public async Task<IActionResult> GetCustomerDemographics([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var demographics = await _reportService.GetCustomerDemographicsAsync(startDate, endDate);
                return Ok(demographics);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri demografikleri alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("customers/retention")]
        [AdminOnly]
        public async Task<IActionResult> GetCustomerRetention([FromQuery] int year)
        {
            try
            {
                var retention = await _reportService.GetCustomerRetentionAsync(year);
                return Ok(retention);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri sadakati raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        #endregion

        #region Revenue Reports

        [HttpGet("revenue")]
        [AdminOnly]
        public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _reportService.GetRevenueReportAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gelir raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("revenue/trends")]
        [AdminOnly]
        public async Task<IActionResult> GetDailyRevenueTrends([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var trends = await _reportService.GetDailyRevenueTrendsAsync(startDate, endDate);
                return Ok(trends);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Gelir trendleri alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("revenue/monthly")]
        [AdminOnly]
        public async Task<IActionResult> GetMonthlyRevenue([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var report = await _reportService.GetMonthlyRevenueAsync(year, month);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Aylık gelir raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("revenue/by-source")]
        [AdminOnly]
        public async Task<IActionResult> GetRevenueBySource([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var report = await _reportService.GetRevenueBySourceAsync(startDate, endDate);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kaynak bazlı gelir raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        #endregion

        #region Dashboard Reports

        [HttpGet("test")]
        [AllRoles]
        public IActionResult TestAuth()
        {
            var user = HttpContext.User;
            var claims = user.Claims.Select(c => new { c.Type, c.Value }).ToList();
            return Ok(new {
                message = "Authentication successful",
                user = user.Identity?.Name,
                isAuthenticated = user.Identity?.IsAuthenticated,
                claims = claims
            });
        }

        [HttpGet("dashboard/summary")]
        [AllRoles]
        public async Task<IActionResult> GetDashboardSummary([FromQuery] DateTime? date)
        {
            try
            {
                var summaryDate = date ?? DateTime.Today;
                var summary = await _reportService.GetDashboardSummaryAsync(summaryDate);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Dashboard özeti alınırken hata oluştu", error = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        #endregion

        #region Export Functions

        [HttpGet("export/excel")]
        [AdminOnly]
        public async Task<IActionResult> ExportToExcel([FromQuery] string reportType, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var excelData = await _reportService.ExportReportToExcelAsync(reportType, startDate, endDate);
                var fileName = $"{reportType}_raporu_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.xlsx";
                
                return File(excelData, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Excel export sırasında hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("export/pdf")]
        [AdminOnly]
        public async Task<IActionResult> ExportToPdf([FromQuery] string reportType, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var pdfData = await _reportService.ExportReportToPdfAsync(reportType, startDate, endDate);
                var fileName = $"{reportType}_raporu_{startDate:yyyyMMdd}_{endDate:yyyyMMdd}.pdf";
                
                return File(pdfData, "application/pdf", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "PDF export sırasında hata oluştu", error = ex.Message });
            }
        }

        #endregion

        #region Business Reports

        [HttpGet("business/monthly")]
        [AdminOnly]
        public async Task<IActionResult> GetMonthlyBusinessReport([FromQuery] int year, [FromQuery] int month)
        {
            try
            {
                var report = await _reportService.GetMonthlyBusinessReportAsync(year, month);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Aylık iş raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("business/yearly")]
        [AdminOnly]
        public async Task<IActionResult> GetYearlyBusinessReport([FromQuery] int year)
        {
            try
            {
                var report = await _reportService.GetYearlyBusinessReportAsync(year);
                return Ok(report);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Yıllık iş raporu alınırken hata oluştu", error = ex.Message });
            }
        }

        #endregion
    }
}
