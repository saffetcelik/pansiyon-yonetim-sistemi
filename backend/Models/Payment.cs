using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum PaymentType
    {
        Reservation = 0,    // Rezervasyon ödemesi
        Sale = 1,          // Satış ödemesi
        Deposit = 2,       // Depozito
        Refund = 3,        // İade
        Other = 4          // Diğer
    }

    public enum PaymentStatus
    {
        Pending = 0,       // Beklemede
        Completed = 1,     // Tamamlandı
        Failed = 2,        // Başarısız
        Cancelled = 3,     // İptal edildi
        Refunded = 4       // İade edildi
    }

    public class Payment
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string PaymentNumber { get; set; } = string.Empty; // PAY-2024-0001

        public PaymentType Type { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        public PaymentMethod Method { get; set; } = PaymentMethod.Cash;

        [StringLength(100)]
        public string? Reference { get; set; } // Banka referansı, fiş no vs.

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? Notes { get; set; }

        // Foreign Keys
        public int? ReservationId { get; set; }
        public int? SaleId { get; set; }
        public int? CustomerId { get; set; }
        public int? UserId { get; set; } // Ödemeyi alan kullanıcı

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("ReservationId")]
        public virtual Reservation? Reservation { get; set; }

        [ForeignKey("SaleId")]
        public virtual Sale? Sale { get; set; }

        [ForeignKey("CustomerId")]
        public virtual Customer? Customer { get; set; }

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
