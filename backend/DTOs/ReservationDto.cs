using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class ReservationDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int RoomId { get; set; }
        public string RoomNumber { get; set; } = string.Empty;
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public int NumberOfGuests { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal RemainingAmount => TotalAmount - PaidAmount;
        public ReservationStatus Status { get; set; }
        public string StatusName => GetStatusName(Status);

        private static string GetStatusName(ReservationStatus status)
        {
            return status switch
            {
                ReservationStatus.Pending => "Beklemede",
                ReservationStatus.Confirmed => "Onaylandı",
                ReservationStatus.CheckedIn => "Giriş Yapıldı",
                ReservationStatus.CheckedOut => "Çıkış Yapıldı",
                ReservationStatus.Cancelled => "İptal Edildi",
                ReservationStatus.NoShow => "Gelmedi",
                _ => status.ToString()
            };
        }
        public string? Notes { get; set; }
        public DateTime? ActualCheckInDate { get; set; }
        public DateTime? ActualCheckOutDate { get; set; }
        public int TotalNights => (CheckOutDate - CheckInDate).Days;
        public bool IsActive => Status == ReservationStatus.Confirmed || Status == ReservationStatus.CheckedIn;
    }

    public class CreateReservationDto
    {
        [Required(ErrorMessage = "Müşteri seçimi zorunludur")]
        public int CustomerId { get; set; }

        [Required(ErrorMessage = "Oda seçimi zorunludur")]
        public int RoomId { get; set; }

        [Required(ErrorMessage = "Giriş tarihi zorunludur")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Çıkış tarihi zorunludur")]
        public DateTime CheckOutDate { get; set; }

        [Range(1, 10, ErrorMessage = "Misafir sayısı 1-10 arasında olmalıdır")]
        public int NumberOfGuests { get; set; }

        [Range(0, 100000, ErrorMessage = "Toplam tutar 0-100000 arasında olmalıdır")]
        public decimal TotalAmount { get; set; }

        [Range(0, 100000, ErrorMessage = "Ödenen tutar 0-100000 arasında olmalıdır")]
        public decimal PaidAmount { get; set; } = 0;

        [StringLength(1000, ErrorMessage = "Notlar en fazla 1000 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class UpdateReservationDto : CreateReservationDto
    {
        public int Id { get; set; }
    }

    public class CheckInDto
    {
        public int ReservationId { get; set; }
        public DateTime ActualCheckInDate { get; set; } = DateTime.Now;
        public string? Notes { get; set; }
    }

    public class CheckOutDto
    {
        public int ReservationId { get; set; }
        public DateTime ActualCheckOutDate { get; set; } = DateTime.Now;
        public decimal? AdditionalCharges { get; set; }
        public string? Notes { get; set; }
    }

    public class ReservationSearchDto
    {
        public string? CustomerName { get; set; }
        public string? RoomNumber { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public ReservationStatus? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
