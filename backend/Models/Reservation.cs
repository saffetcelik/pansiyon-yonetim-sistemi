using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum ReservationStatus
    {
        Pending = 0,        // Beklemede
        Confirmed = 1,      // Onaylandı
        CheckedIn = 2,      // Giriş Yapıldı
        CheckedOut = 3,     // Çıkış Yapıldı
        Cancelled = 4,      // İptal Edildi
        NoShow = 5          // Gelmedi
    }

    public class Reservation
    {
        public int Id { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public int RoomId { get; set; }
        
        [Required]
        public DateTime CheckInDate { get; set; }
        
        [Required]
        public DateTime CheckOutDate { get; set; }
        
        public int NumberOfGuests { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal TotalAmount { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal PaidAmount { get; set; } = 0;
        
        public ReservationStatus Status { get; set; } = ReservationStatus.Pending;
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        public DateTime? ActualCheckInDate { get; set; }
        public DateTime? ActualCheckOutDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation Properties
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; } = null!;

        [ForeignKey("RoomId")]
        public virtual Room Room { get; set; } = null!;

        public virtual ICollection<Sale> Sales { get; set; } = new List<Sale>();

        /// <summary>
        /// Rezervasyondaki tüm müşteriler (çoklu müşteri desteği)
        /// </summary>
        public virtual ICollection<ReservationCustomer> ReservationCustomers { get; set; } = new List<ReservationCustomer>();
    }
}
