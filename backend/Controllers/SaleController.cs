using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PansiyonYonetimSistemi.API.Models;
using PansiyonYonetimSistemi.API.Services;
using PansiyonYonetimSistemi.API.DTOs;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SaleController : ControllerBase
    {
        private readonly ISaleService _saleService;

        public SaleController(ISaleService saleService)
        {
            _saleService = saleService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetSales()
        {
            try
            {
                var sales = await _saleService.GetAllSalesAsync();
                var saleDtos = sales.Select(s => new SaleDto
                {
                    Id = s.Id,
                    SaleNumber = s.SaleNumber,
                    CustomerId = s.CustomerId,
                    CustomerName = s.Customer?.FirstName + " " + s.Customer?.LastName,
                    ReservationId = s.ReservationId,
                    TotalAmount = s.TotalAmount,
                    DiscountAmount = s.DiscountAmount,
                    NetAmount = s.NetAmount,
                    PaymentMethod = s.PaymentMethod.ToString(),
                    SaleDate = s.SaleDate,
                    Notes = s.Notes,
                    SaleItems = s.SaleItems.Select(si => new SaleItemDto
                    {
                        Id = si.Id,
                        ProductId = si.ProductId,
                        ProductName = si.Product.Name,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.TotalPrice
                    }).ToList()
                });

                return Ok(saleDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Satışlar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SaleDto>> GetSale(int id)
        {
            try
            {
                var sale = await _saleService.GetSaleByIdAsync(id);
                if (sale == null)
                {
                    return NotFound(new { message = "Satış bulunamadı" });
                }

                var saleDto = new SaleDto
                {
                    Id = sale.Id,
                    SaleNumber = sale.SaleNumber,
                    CustomerId = sale.CustomerId,
                    CustomerName = sale.Customer?.FirstName + " " + sale.Customer?.LastName,
                    ReservationId = sale.ReservationId,
                    TotalAmount = sale.TotalAmount,
                    DiscountAmount = sale.DiscountAmount,
                    NetAmount = sale.NetAmount,
                    PaymentMethod = sale.PaymentMethod.ToString(),
                    SaleDate = sale.SaleDate,
                    Notes = sale.Notes,
                    SaleItems = sale.SaleItems.Select(si => new SaleItemDto
                    {
                        Id = si.Id,
                        ProductId = si.ProductId,
                        ProductName = si.Product.Name,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.TotalPrice
                    }).ToList()
                };

                return Ok(saleDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Satış getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<ActionResult<SaleDto>> CreateSale(CreateSaleDto createSaleDto)
        {
            try
            {
                if (!Enum.TryParse<PaymentMethod>(createSaleDto.PaymentMethod, out var paymentMethod))
                {
                    return BadRequest(new { message = "Geçersiz ödeme yöntemi" });
                }

                var sale = new Sale
                {
                    CustomerId = createSaleDto.CustomerId,
                    ReservationId = createSaleDto.ReservationId,
                    DiscountAmount = createSaleDto.DiscountAmount,
                    PaymentMethod = paymentMethod,
                    Notes = createSaleDto.Notes,
                    SaleItems = createSaleDto.SaleItems.Select(si => new SaleItem
                    {
                        ProductId = si.ProductId,
                        Quantity = si.Quantity,
                        UnitPrice = si.UnitPrice,
                        TotalPrice = si.Quantity * si.UnitPrice
                    }).ToList()
                };

                var createdSale = await _saleService.CreateSaleAsync(sale);

                var saleDto = new SaleDto
                {
                    Id = createdSale.Id,
                    SaleNumber = createdSale.SaleNumber,
                    CustomerId = createdSale.CustomerId,
                    ReservationId = createdSale.ReservationId,
                    TotalAmount = createdSale.TotalAmount,
                    DiscountAmount = createdSale.DiscountAmount,
                    NetAmount = createdSale.NetAmount,
                    PaymentMethod = createdSale.PaymentMethod.ToString(),
                    SaleDate = createdSale.SaleDate,
                    Notes = createdSale.Notes
                };

                return CreatedAtAction(nameof(GetSale), new { id = createdSale.Id }, saleDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Satış oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("daily/{date}")]
        public async Task<ActionResult<decimal>> GetDailySales(DateTime date)
        {
            try
            {
                var dailySales = await _saleService.GetDailySalesAsync(date);
                return Ok(new { date = date.ToString("yyyy-MM-dd"), totalSales = dailySales });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Günlük satışlar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("monthly/{year}/{month}")]
        public async Task<ActionResult<decimal>> GetMonthlySales(int year, int month)
        {
            try
            {
                var monthlySales = await _saleService.GetMonthlySalesAsync(year, month);
                return Ok(new { year, month, totalSales = monthlySales });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Aylık satışlar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetSalesByCustomer(int customerId)
        {
            try
            {
                var sales = await _saleService.GetSalesByCustomerAsync(customerId);
                var saleDtos = sales.Select(s => new SaleDto
                {
                    Id = s.Id,
                    SaleNumber = s.SaleNumber,
                    TotalAmount = s.TotalAmount,
                    DiscountAmount = s.DiscountAmount,
                    NetAmount = s.NetAmount,
                    PaymentMethod = s.PaymentMethod.ToString(),
                    SaleDate = s.SaleDate,
                    Notes = s.Notes
                });

                return Ok(saleDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri satışları getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("date-range")]
        public async Task<ActionResult<IEnumerable<SaleDto>>> GetSalesByDateRange(
            [FromQuery] DateTime startDate, 
            [FromQuery] DateTime endDate)
        {
            try
            {
                var sales = await _saleService.GetSalesByDateRangeAsync(startDate, endDate);
                var saleDtos = sales.Select(s => new SaleDto
                {
                    Id = s.Id,
                    SaleNumber = s.SaleNumber,
                    CustomerId = s.CustomerId,
                    CustomerName = s.Customer?.FirstName + " " + s.Customer?.LastName,
                    TotalAmount = s.TotalAmount,
                    DiscountAmount = s.DiscountAmount,
                    NetAmount = s.NetAmount,
                    PaymentMethod = s.PaymentMethod.ToString(),
                    SaleDate = s.SaleDate,
                    Notes = s.Notes
                });

                return Ok(saleDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Tarih aralığı satışları getirilirken hata oluştu", error = ex.Message });
            }
        }
    }
}
