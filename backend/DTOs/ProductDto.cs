using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class ProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ProductCategory Category { get; set; }
        public string CategoryName => Category.ToString();
        public decimal Price { get; set; }
        public decimal CostPrice { get; set; }
        public int StockQuantity { get; set; }
        public int MinStockLevel { get; set; }
        public string? Barcode { get; set; }
        public string? Unit { get; set; }
        public bool IsActive { get; set; }
        public bool IsLowStock => StockQuantity <= MinStockLevel;
        public decimal ProfitMargin => Price > 0 ? ((Price - CostPrice) / Price) * 100 : 0;
    }

    public class CreateProductDto
    {
        [Required(ErrorMessage = "Ürün adı zorunludur")]
        [StringLength(100, ErrorMessage = "Ürün adı en fazla 100 karakter olabilir")]
        public string Name { get; set; } = string.Empty;

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Kategori seçimi zorunludur")]
        public ProductCategory Category { get; set; }

        [Range(0.01, 10000, ErrorMessage = "Fiyat 0.01-10000 arasında olmalıdır")]
        public decimal Price { get; set; }

        [Range(0, 10000, ErrorMessage = "Maliyet fiyatı 0-10000 arasında olmalıdır")]
        public decimal CostPrice { get; set; }

        [Range(0, 100000, ErrorMessage = "Stok miktarı 0-100000 arasında olmalıdır")]
        public int StockQuantity { get; set; }

        [Range(0, 1000, ErrorMessage = "Minimum stok seviyesi 0-1000 arasında olmalıdır")]
        public int MinStockLevel { get; set; } = 5;

        [StringLength(50, ErrorMessage = "Barkod en fazla 50 karakter olabilir")]
        public string? Barcode { get; set; }

        [StringLength(20, ErrorMessage = "Birim en fazla 20 karakter olabilir")]
        public string? Unit { get; set; } = "Adet";

        public bool IsActive { get; set; } = true;
    }

    public class UpdateProductDto : CreateProductDto
    {
        public int Id { get; set; }
    }

    public class ProductSearchDto
    {
        public string? Name { get; set; }
        public ProductCategory? Category { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsLowStock { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
