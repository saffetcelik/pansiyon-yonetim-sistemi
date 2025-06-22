using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface ISaleService
    {
        Task<IEnumerable<Sale>> GetAllSalesAsync();
        Task<Sale?> GetSaleByIdAsync(int id);
        Task<Sale> CreateSaleAsync(Sale sale);
        Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<Sale>> GetSalesByCustomerAsync(int customerId);
        Task<decimal> GetDailySalesAsync(DateTime date);
        Task<decimal> GetMonthlySalesAsync(int year, int month);
        Task<string> GenerateSaleNumberAsync();
    }

    public class SaleService : ISaleService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductService _productService;

        public SaleService(ApplicationDbContext context, IProductService productService)
        {
            _context = context;
            _productService = productService;
        }

        public async Task<IEnumerable<Sale>> GetAllSalesAsync()
        {
            return await _context.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Include(s => s.Customer)
                .Include(s => s.Reservation)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<Sale?> GetSaleByIdAsync(int id)
        {
            return await _context.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Include(s => s.Customer)
                .Include(s => s.Reservation)
                .FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Sale> CreateSaleAsync(Sale sale)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            
            try
            {
                // Generate sale number
                sale.SaleNumber = await GenerateSaleNumberAsync();
                sale.CreatedAt = DateTime.UtcNow;
                sale.UpdatedAt = DateTime.UtcNow;
                sale.SaleDate = DateTime.UtcNow;

                // Calculate totals
                sale.TotalAmount = sale.SaleItems.Sum(si => si.TotalPrice);
                sale.NetAmount = sale.TotalAmount - sale.DiscountAmount;

                _context.Sales.Add(sale);
                await _context.SaveChangesAsync();

                // Update stock for each sale item
                foreach (var saleItem in sale.SaleItems)
                {
                    await _productService.UpdateStockAsync(
                        saleItem.ProductId, 
                        saleItem.Quantity, 
                        TransactionType.StockOut, 
                        $"Satış: {sale.SaleNumber}"
                    );
                }

                await transaction.CommitAsync();
                return sale;
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<IEnumerable<Sale>> GetSalesByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Include(s => s.Customer)
                .Where(s => s.SaleDate >= startDate && s.SaleDate <= endDate)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Sale>> GetSalesByCustomerAsync(int customerId)
        {
            return await _context.Sales
                .Include(s => s.SaleItems)
                    .ThenInclude(si => si.Product)
                .Where(s => s.CustomerId == customerId)
                .OrderByDescending(s => s.SaleDate)
                .ToListAsync();
        }

        public async Task<decimal> GetDailySalesAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            return await _context.Sales
                .Where(s => s.SaleDate >= startDate && s.SaleDate < endDate)
                .SumAsync(s => s.NetAmount);
        }

        public async Task<decimal> GetMonthlySalesAsync(int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1);

            return await _context.Sales
                .Where(s => s.SaleDate >= startDate && s.SaleDate < endDate)
                .SumAsync(s => s.NetAmount);
        }

        public async Task<string> GenerateSaleNumberAsync()
        {
            var today = DateTime.Today;
            var prefix = $"SAT-{today:yyyy-MM-dd}";
            
            var lastSale = await _context.Sales
                .Where(s => s.SaleNumber.StartsWith(prefix))
                .OrderByDescending(s => s.SaleNumber)
                .FirstOrDefaultAsync();

            if (lastSale == null)
            {
                return $"{prefix}-001";
            }

            var lastNumber = lastSale.SaleNumber.Split('-').Last();
            if (int.TryParse(lastNumber, out int number))
            {
                return $"{prefix}-{(number + 1):D3}";
            }

            return $"{prefix}-001";
        }
    }
}
