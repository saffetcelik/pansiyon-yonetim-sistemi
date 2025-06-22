using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum TransactionType
    {
        StockIn = 0,        // Stok Girişi
        StockOut = 1,       // Stok Çıkışı
        Adjustment = 2      // Düzeltme
    }

    public class StockTransaction
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        public TransactionType Type { get; set; }
        
        [Required]
        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal? UnitCost { get; set; }
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        [StringLength(100)]
        public string? Reference { get; set; }
        
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
    }
}
