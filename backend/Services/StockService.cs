using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IStockService
    {
        Task<IEnumerable<StockTransaction>> GetStockTransactionsAsync(int? productId = null);
        Task<StockTransaction?> GetStockTransactionByIdAsync(int id);
        Task<StockTransaction> CreateStockTransactionAsync(StockTransaction transaction);
        Task<IEnumerable<StockTransaction>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<IEnumerable<StockTransaction>> GetTransactionsByTypeAsync(TransactionType type);
        Task<decimal> GetTotalStockValueAsync();
        Task<Dictionary<ProductCategory, int>> GetStockByCategory();
    }

    public class StockService : IStockService
    {
        private readonly ApplicationDbContext _context;

        public StockService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<StockTransaction>> GetStockTransactionsAsync(int? productId = null)
        {
            var query = _context.StockTransactions
                .Include(st => st.Product)
                .AsQueryable();

            if (productId.HasValue)
            {
                query = query.Where(st => st.ProductId == productId.Value);
            }

            return await query
                .OrderByDescending(st => st.TransactionDate)
                .ToListAsync();
        }

        public async Task<StockTransaction?> GetStockTransactionByIdAsync(int id)
        {
            return await _context.StockTransactions
                .Include(st => st.Product)
                .FirstOrDefaultAsync(st => st.Id == id);
        }

        public async Task<StockTransaction> CreateStockTransactionAsync(StockTransaction transaction)
        {
            transaction.CreatedAt = DateTime.UtcNow;
            transaction.TransactionDate = DateTime.UtcNow;

            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return transaction;
        }

        public async Task<IEnumerable<StockTransaction>> GetTransactionsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.StockTransactions
                .Include(st => st.Product)
                .Where(st => st.TransactionDate >= startDate && st.TransactionDate <= endDate)
                .OrderByDescending(st => st.TransactionDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<StockTransaction>> GetTransactionsByTypeAsync(TransactionType type)
        {
            return await _context.StockTransactions
                .Include(st => st.Product)
                .Where(st => st.Type == type)
                .OrderByDescending(st => st.TransactionDate)
                .ToListAsync();
        }

        public async Task<decimal> GetTotalStockValueAsync()
        {
            return await _context.Products
                .Where(p => p.IsActive)
                .SumAsync(p => p.StockQuantity * p.Price);
        }

        public async Task<Dictionary<ProductCategory, int>> GetStockByCategory()
        {
            return await _context.Products
                .Where(p => p.IsActive)
                .GroupBy(p => p.Category)
                .ToDictionaryAsync(g => g.Key, g => g.Sum(p => p.StockQuantity));
        }
    }
}
