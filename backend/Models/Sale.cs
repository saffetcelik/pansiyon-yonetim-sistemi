using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum PaymentMethod
    {
        Cash = 0,       // Nakit
        Card = 1,       // Kart
        Transfer = 2    // Havale
    }

    public class Sale
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string SaleNumber { get; set; } = string.Empty; // SAT-2024-0001

        public int? ReservationId { get; set; }
        public int? CustomerId { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal DiscountAmount { get; set; } = 0;

        [Column(TypeName = "decimal(10,2)")]
        public decimal NetAmount { get; set; }

        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;

        public DateTime SaleDate { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("ReservationId")]
        public virtual Reservation? Reservation { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        public virtual ICollection<SaleItem> SaleItems { get; set; } = new List<SaleItem>();
    }

    public class SaleItem
    {
        public int Id { get; set; }

        [Required]
        public int SaleId { get; set; }

        [Required]
        public int ProductId { get; set; }

        [Required]
        public int Quantity { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal UnitPrice { get; set; }

        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalPrice { get; set; }

        // Navigation Properties
        [ForeignKey("SaleId")]
        public virtual Sale Sale { get; set; } = null!;

        [ForeignKey("ProductId")]
        public virtual Product Product { get; set; } = null!;
    }
}
