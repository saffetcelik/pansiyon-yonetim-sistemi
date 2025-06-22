using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class RoomDto
    {
        public int Id { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public RoomType Type { get; set; }
        public string TypeName => Type.ToString();
        public RoomStatus Status { get; set; }
        public string StatusName => GetStatusName(Status);

        private static string GetStatusName(RoomStatus status)
        {
            return status switch
            {
                RoomStatus.Available => "Müsait",
                RoomStatus.Occupied => "Dolu",
                RoomStatus.Cleaning => "Temizlik",
                RoomStatus.Maintenance => "Bakım",
                RoomStatus.OutOfOrder => "Arızalı",
                _ => status.ToString()
            };
        }
        public int Capacity { get; set; }
        public decimal PricePerNight { get; set; }
        public string? Description { get; set; }
        public bool HasBalcony { get; set; }
        public bool HasSeaView { get; set; }
        public bool HasAirConditioning { get; set; }
        public bool HasMinibar { get; set; }
        public bool HasTV { get; set; }
        public bool HasWiFi { get; set; }
        public bool IsAvailable => Status == RoomStatus.Available;
    }

    public class CreateRoomDto
    {
        [Required(ErrorMessage = "Oda numarası zorunludur")]
        [StringLength(10, ErrorMessage = "Oda numarası en fazla 10 karakter olabilir")]
        public string RoomNumber { get; set; } = string.Empty;

        [Required(ErrorMessage = "Oda tipi zorunludur")]
        public RoomType Type { get; set; }

        [Range(1, 10, ErrorMessage = "Kapasite 1-10 arasında olmalıdır")]
        public int Capacity { get; set; }

        [Range(0.01, 10000, ErrorMessage = "Fiyat 0.01-10000 arasında olmalıdır")]
        public decimal PricePerNight { get; set; }

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }

        public bool HasBalcony { get; set; }
        public bool HasSeaView { get; set; }
        public bool HasAirConditioning { get; set; }
        public bool HasMinibar { get; set; }
        public bool HasTV { get; set; }
        public bool HasWiFi { get; set; } = true;
    }

    public class UpdateRoomDto : CreateRoomDto
    {
        public int Id { get; set; }
    }

    public class UpdateRoomStatusDto
    {
        [Required(ErrorMessage = "Oda durumu zorunludur")]
        public RoomStatus Status { get; set; }
    }

    public class RoomAvailabilityDto
    {
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public bool IsAvailable { get; set; }
        public DateTime? NextAvailableDate { get; set; }
        public DateTime? OccupiedUntil { get; set; }
    }
}
