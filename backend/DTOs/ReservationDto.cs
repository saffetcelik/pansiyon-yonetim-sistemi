using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class ReservationDto
    {
        public int Id { get; set; }
        public string? ReservationName { get; set; }
        public string? ReservationGroupId { get; set; }
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
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

        /// <summary>
        /// Rezervasyondaki tüm müşteriler
        /// </summary>
        public List<ReservationCustomerDto> Customers { get; set; } = new List<ReservationCustomerDto>();

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

    /// <summary>
    /// Çoklu oda rezervasyonu için her oda başına veri
    /// </summary>
    public class RoomReservationItemDto
    {
        [Required(ErrorMessage = "Oda seçimi zorunludur")]
        public int RoomId { get; set; }

        [Range(1, 10, ErrorMessage = "Misafir sayısı 1-10 arasında olmalıdır")]
        public int NumberOfGuests { get; set; } = 1;

        [Range(0, 100000, ErrorMessage = "Toplam tutar 0-100000 arasında olmalıdır")]
        public decimal TotalAmount { get; set; }

        [Range(0, 100000, ErrorMessage = "Ödenen tutar 0-100000 arasında olmalıdır")]
        public decimal PaidAmount { get; set; } = 0;

        /// <summary>
        /// Bu odadaki müşteri ID'leri
        /// </summary>
        public List<int> CustomerIds { get; set; } = new List<int>();
    }

    public class CreateReservationDto
    {
        /// <summary>
        /// Rezervasyon adı (opsiyonel). Hiç müşteri seçilmemişse zorunludur.
        /// </summary>
        [StringLength(200, ErrorMessage = "Rezervasyon adı en fazla 200 karakter olabilir")]
        public string? ReservationName { get; set; }

        /// <summary>
        /// Çoklu oda gruplama ID'si. Birden fazla oda seçiliyse tüm odalara aynı GroupId atanır.
        /// </summary>
        [StringLength(36)]
        public string? ReservationGroupId { get; set; }

        /// <summary>
        /// Ana müşteri ID'si (opsiyonel). Çoklu oda varsa her odanın müşterileri RoomItems'tan alınır.
        /// </summary>
        public int? CustomerId { get; set; }

        /// <summary>
        /// Tekil oda rezervasyonu için oda ID'si (RoomItems boşsa kullanılır)
        /// </summary>
        public int RoomId { get; set; }

        [Required(ErrorMessage = "Giriş tarihi zorunludur")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Çıkış tarihi zorunludur")]
        public DateTime CheckOutDate { get; set; }

        [Range(1, 10, ErrorMessage = "Misafir sayısı 1-10 arasında olmalıdır")]
        public int NumberOfGuests { get; set; } = 1;

        [Range(0, 100000, ErrorMessage = "Toplam tutar 0-100000 arasında olmalıdır")]
        public decimal TotalAmount { get; set; }

        [Range(0, 100000, ErrorMessage = "Ödenen tutar 0-100000 arasında olmalıdır")]
        public decimal PaidAmount { get; set; } = 0;

        [StringLength(1000, ErrorMessage = "Notlar en fazla 1000 karakter olabilir")]
        public string? Notes { get; set; }

        /// <summary>
        /// Rezervasyona eklenecek müşteri ID'leri (tekil oda için)
        /// </summary>
        public List<int> CustomerIds { get; set; } = new List<int>();

        /// <summary>
        /// Çoklu oda rezervasyonu için oda listesi.
        /// Dolu ise bu liste kullanılır; boşsa RoomId/NumberOfGuests/TotalAmount/PaidAmount/CustomerIds kullanılır.
        /// </summary>
        public List<RoomReservationItemDto> RoomItems { get; set; } = new List<RoomReservationItemDto>();
    }

    public class UpdateReservationDto
    {
        public int Id { get; set; }

        [StringLength(200, ErrorMessage = "Rezervasyon adı en fazla 200 karakter olabilir")]
        public string? ReservationName { get; set; }

        [StringLength(36)]
        public string? ReservationGroupId { get; set; }

        public int? CustomerId { get; set; }

        public int RoomId { get; set; }

        [Required(ErrorMessage = "Giriş tarihi zorunludur")]
        public DateTime CheckInDate { get; set; }

        [Required(ErrorMessage = "Çıkış tarihi zorunludur")]
        public DateTime CheckOutDate { get; set; }

        [Range(1, 10, ErrorMessage = "Misafir sayısı 1-10 arasında olmalıdır")]
        public int NumberOfGuests { get; set; } = 1;

        [Range(0, 100000, ErrorMessage = "Toplam tutar 0-100000 arasında olmalıdır")]
        public decimal TotalAmount { get; set; }

        [Range(0, 100000, ErrorMessage = "Ödenen tutar 0-100000 arasında olmalıdır")]
        public decimal PaidAmount { get; set; } = 0;

        [StringLength(1000, ErrorMessage = "Notlar en fazla 1000 karakter olabilir")]
        public string? Notes { get; set; }

        public ReservationStatus? Status { get; set; }

        public List<int> CustomerIds { get; set; } = new List<int>();

        public List<RoomReservationItemDto> RoomItems { get; set; } = new List<RoomReservationItemDto>();
    }

    public class UpdateStatusDto
    {
        [Required(ErrorMessage = "Durum seçimi zorunludur")]
        public ReservationStatus Status { get; set; }
    }

    public class CheckInDto
    {
        public int ReservationId { get; set; }
        public DateTime ActualCheckInDate { get; set; } = DateTime.Now;
        public decimal? PaymentAmount { get; set; }
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
        public int? CustomerId { get; set; }
        public string? RoomNumber { get; set; }
        public DateTime? CheckInDate { get; set; }
        public DateTime? CheckOutDate { get; set; }
        public ReservationStatus? Status { get; set; }
        public bool ExcludeCheckedOut { get; set; } = false;
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ReservationCustomerDto
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public string? TCKimlikNo { get; set; }
        public string? Phone { get; set; }
        public string Role { get; set; } = "Guest"; // "Primary", "Guest"
        public int OrderIndex { get; set; }
    }
}
