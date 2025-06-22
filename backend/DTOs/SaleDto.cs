using System.ComponentModel.DataAnnotations;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class SaleDto
    {
        public int Id { get; set; }
        public string SaleNumber { get; set; } = string.Empty;
        public int? CustomerId { get; set; }
        public string? CustomerName { get; set; }
        public int? ReservationId { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal DiscountAmount { get; set; }
        public decimal NetAmount { get; set; }
        public string PaymentMethod { get; set; } = string.Empty;
        public DateTime SaleDate { get; set; }
        public string? Notes { get; set; }
        public List<SaleItemDto> SaleItems { get; set; } = new List<SaleItemDto>();
    }

    public class SaleItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }

    public class CreateSaleDto
    {
        public int? CustomerId { get; set; }
        public int? ReservationId { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "İndirim miktarı 0 veya pozitif olmalıdır")]
        public decimal DiscountAmount { get; set; } = 0;

        [Required(ErrorMessage = "Ödeme yöntemi seçimi zorunludur")]
        public string PaymentMethod { get; set; } = "Cash";

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }

        [Required(ErrorMessage = "En az bir ürün seçilmelidir")]
        [MinLength(1, ErrorMessage = "En az bir ürün seçilmelidir")]
        public List<CreateSaleItemDto> SaleItems { get; set; } = new List<CreateSaleItemDto>();
    }

    public class CreateSaleItemDto
    {
        [Required(ErrorMessage = "Ürün seçimi zorunludur")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Miktar belirtilmelidir")]
        [Range(1, int.MaxValue, ErrorMessage = "Miktar 1 veya daha fazla olmalıdır")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "Birim fiyat belirtilmelidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Birim fiyat 0.01 veya daha fazla olmalıdır")]
        public decimal UnitPrice { get; set; }
    }

    public class SaleSearchDto
    {
        public int? CustomerId { get; set; }
        public int? ReservationId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? PaymentMethod { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
