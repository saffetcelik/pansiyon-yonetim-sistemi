using System.ComponentModel.DataAnnotations;

namespace PansiyonYonetimSistemi.API.Models
{
    public class Customer
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [StringLength(11)]
        public string? TCKimlikNo { get; set; }
        
        [StringLength(50)]
        public string? PassportNo { get; set; }
        
        [StringLength(15)]
        public string? Phone { get; set; }
        
        [StringLength(100)]
        public string? Email { get; set; }
        
        [StringLength(500)]
        public string? Address { get; set; }
        
        [StringLength(100)]
        public string? City { get; set; }
        
        [StringLength(100)]
        public string? Country { get; set; }
        
        public DateTime? DateOfBirth { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation Properties
        public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();

        /// <summary>
        /// Bu müşterinin dahil olduğu tüm rezervasyonlar (çoklu müşteri desteği)
        /// </summary>
        public virtual ICollection<ReservationCustomer> ReservationCustomers { get; set; } = new List<ReservationCustomer>();
    }
}
