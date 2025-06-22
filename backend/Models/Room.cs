using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum RoomStatus
    {
        Available = 0,      // Müsait
        Occupied = 1,       // Dolu
        Cleaning = 2,       // Temizlik
        Maintenance = 3,    // Bakım
        OutOfOrder = 4      // Arızalı
    }

    public enum RoomType
    {
        Single = 0,         // Tek Kişilik
        Double = 1,         // Çift Kişilik
        Triple = 2,         // Üç Kişilik
        Family = 3,         // Aile Odası
        Suite = 4           // Suit
    }

    public class Room
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(10)]
        public string RoomNumber { get; set; } = string.Empty;
        
        public RoomType Type { get; set; }
        
        public RoomStatus Status { get; set; } = RoomStatus.Available;
        
        public int Capacity { get; set; }
        
        [Column(TypeName = "decimal(10,2)")]
        public decimal PricePerNight { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public bool HasBalcony { get; set; }
        public bool HasSeaView { get; set; }
        public bool HasAirConditioning { get; set; }
        public bool HasMinibar { get; set; }
        public bool HasTV { get; set; }
        public bool HasWiFi { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation Properties
        public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    }
}
