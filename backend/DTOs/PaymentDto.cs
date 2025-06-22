using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class PaymentDto
    {
        public int Id { get; set; }
        public string PaymentNumber { get; set; } = string.Empty;
        public PaymentType Type { get; set; }
        public string TypeName => GetTypeName(Type);
        public PaymentStatus Status { get; set; }
        public string StatusName => GetStatusName(Status);
        public decimal Amount { get; set; }
        public PaymentMethod Method { get; set; }
        public string MethodName => Method.ToString();
        public string? Reference { get; set; }
        public DateTime PaymentDate { get; set; }
        public string? Description { get; set; }
        public string? Notes { get; set; }
        public int? ReservationId { get; set; }
        public int? SaleId { get; set; }
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public DateTime CreatedAt { get; set; }

        private static string GetTypeName(PaymentType type)
        {
            return type switch
            {
                PaymentType.Reservation => "Rezervasyon",
                PaymentType.Sale => "Satış",
                PaymentType.Deposit => "Depozito",
                PaymentType.Refund => "İade",
                PaymentType.Other => "Diğer",
                _ => "Bilinmeyen"
            };
        }

        private static string GetStatusName(PaymentStatus status)
        {
            return status switch
            {
                PaymentStatus.Pending => "Beklemede",
                PaymentStatus.Completed => "Tamamlandı",
                PaymentStatus.Failed => "Başarısız",
                PaymentStatus.Cancelled => "İptal",
                PaymentStatus.Refunded => "İade Edildi",
                _ => "Bilinmeyen"
            };
        }
    }

    public class CreatePaymentDto
    {
        [Required(ErrorMessage = "Ödeme tipi seçimi zorunludur")]
        public PaymentType Type { get; set; }

        [Required(ErrorMessage = "Tutar belirtilmelidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0.01 veya daha fazla olmalıdır")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Ödeme yöntemi seçimi zorunludur")]
        public PaymentMethod Method { get; set; }

        [StringLength(100, ErrorMessage = "Referans en fazla 100 karakter olabilir")]
        public string? Reference { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }

        public int? ReservationId { get; set; }
        public int? SaleId { get; set; }
        public int? CustomerId { get; set; }
    }

    public class UpdatePaymentDto
    {
        [Required(ErrorMessage = "Ödeme durumu seçimi zorunludur")]
        public PaymentStatus Status { get; set; }

        [StringLength(100, ErrorMessage = "Referans en fazla 100 karakter olabilir")]
        public string? Reference { get; set; }

        [StringLength(500, ErrorMessage = "Açıklama en fazla 500 karakter olabilir")]
        public string? Description { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class PaymentSearchDto
    {
        public PaymentType? Type { get; set; }
        public PaymentStatus? Status { get; set; }
        public PaymentMethod? Method { get; set; }
        public int? CustomerId { get; set; }
        public int? ReservationId { get; set; }
        public int? SaleId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PaymentSummaryDto
    {
        public decimal TotalAmount { get; set; }
        public decimal CashAmount { get; set; }
        public decimal CardAmount { get; set; }
        public decimal TransferAmount { get; set; }
        public int TotalCount { get; set; }
        public DateTime Date { get; set; }
    }
}
