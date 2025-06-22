using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum ProductCategory
    {
        Food = 0,           // Yiyecek
        Beverage = 1,       // İçecek
        Snack = 2,          // Atıştırmalık
        Personal = 3,       // Kişisel Bakım
        Other = 4           // Diğer
    }

    public class Product
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public ProductCategory Category { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal Price { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal CostPrice { get; set; }
        
        public int StockQuantity { get; set; }
        
        public int MinStockLevel { get; set; } = 5;
        
        [StringLength(50)]
        public string? Barcode { get; set; }
        
        [StringLength(20)]
        public string? Unit { get; set; } = "Adet";
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation Properties
        public virtual ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
        public virtual ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
    }
}
