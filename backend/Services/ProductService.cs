using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IProductService
    {
        Task<IEnumerable<Product>> GetAllProductsAsync();
        Task<Product?> GetProductByIdAsync(int id);
        Task<Product> CreateProductAsync(Product product);
        Task<Product?> UpdateProductAsync(int id, Product product);
        Task<bool> DeleteProductAsync(int id);
        Task<IEnumerable<Product>> GetLowStockProductsAsync();
        Task<bool> UpdateStockAsync(int productId, int quantity, TransactionType type, string? notes = null);
        Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm);
        Task<IEnumerable<Product>> GetProductsByCategoryAsync(ProductCategory category);
    }

    public class ProductService : IProductService
    {
        private readonly ApplicationDbContext _context;

        public ProductService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Product>> GetAllProductsAsync()
        {
            return await _context.Products
                .Where(p => p.IsActive)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            return await _context.Products
                .Include(p => p.StockTransactions)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);
        }

        public async Task<Product> CreateProductAsync(Product product)
        {
            product.CreatedAt = DateTime.UtcNow;
            product.UpdatedAt = DateTime.UtcNow;
            
            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            
            return product;
        }

        public async Task<Product?> UpdateProductAsync(int id, Product product)
        {
            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null || !existingProduct.IsActive)
                return null;

            existingProduct.Name = product.Name;
            existingProduct.Description = product.Description;
            existingProduct.Category = product.Category;
            existingProduct.Price = product.Price;
            existingProduct.MinStockLevel = product.MinStockLevel;
            existingProduct.Unit = product.Unit;
            existingProduct.Barcode = product.Barcode;
            existingProduct.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return existingProduct;
        }

        public async Task<bool> DeleteProductAsync(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return false;

            // Soft delete
            product.IsActive = false;
            product.UpdatedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<IEnumerable<Product>> GetLowStockProductsAsync()
        {
            return await _context.Products
                .Where(p => p.IsActive && p.StockQuantity <= p.MinStockLevel)
                .OrderBy(p => p.StockQuantity)
                .ToListAsync();
        }

        public async Task<bool> UpdateStockAsync(int productId, int quantity, TransactionType type, string? notes = null)
        {
            var product = await _context.Products.FindAsync(productId);
            if (product == null || !product.IsActive)
                return false;

            // Create stock transaction
            var transaction = new StockTransaction
            {
                ProductId = productId,
                Type = type,
                Quantity = Math.Abs(quantity),
                Notes = notes,
                TransactionDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            // Update product stock
            switch (type)
            {
                case TransactionType.StockIn:
                    product.StockQuantity += Math.Abs(quantity);
                    break;
                case TransactionType.StockOut:
                    product.StockQuantity -= Math.Abs(quantity);
                    if (product.StockQuantity < 0)
                        product.StockQuantity = 0;
                    break;
                case TransactionType.Adjustment:
                    product.StockQuantity = Math.Abs(quantity);
                    break;
            }

            product.UpdatedAt = DateTime.UtcNow;

            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<Product>> SearchProductsAsync(string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetAllProductsAsync();

            return await _context.Products
                .Where(p => p.IsActive && 
                           (p.Name.Contains(searchTerm) || 
                            p.Description!.Contains(searchTerm) ||
                            p.Barcode!.Contains(searchTerm)))
                .OrderBy(p => p.Name)
                .ToListAsync();
        }

        public async Task<IEnumerable<Product>> GetProductsByCategoryAsync(ProductCategory category)
        {
            return await _context.Products
                .Where(p => p.IsActive && p.Category == category)
                .OrderBy(p => p.Name)
                .ToListAsync();
        }
    }
}
