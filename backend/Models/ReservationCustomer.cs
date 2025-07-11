using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public class ReservationCustomer
    {
        public int Id { get; set; }
        
        [Required]
        public int ReservationId { get; set; }
        
        [Required]
        public int CustomerId { get; set; }
        
        /// <summary>
        /// Rezervasyondaki müşterinin rolü (Ana Müşteri, Ek Müşteri)
        /// </summary>
        [StringLength(50)]
        public string Role { get; set; } = "Guest"; // "Primary", "Guest"
        
        /// <summary>
        /// Bu müşterinin rezervasyondaki sırası
        /// </summary>
        public int OrderIndex { get; set; } = 0;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey("ReservationId")]
        public virtual Reservation Reservation { get; set; } = null!;
        
        [ForeignKey("CustomerId")]
        public virtual Customer Customer { get; set; } = null!;
    }
}
