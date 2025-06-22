using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public class Sale
    {
        public int Id { get; set; }
        
        [Required]
        public int ProductId { get; set; }
        
        public int? ReservationId { get; set; }
        
        [Required]
        public int Quantity { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }
        
        public DateTime SaleDate { get; set; } = DateTime.UtcNow;
        
        [StringLength(500)]
        public string? Notes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
        
        [ForeignKey("ReservationId")]
        public virtual Reservation? Reservation { get; set; }
    }
}
