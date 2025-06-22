using System.ComponentModel.DataAnnotations;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class SaleDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int? ReservationId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime SaleDate { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateSaleDto
    {
        [Required(ErrorMessage = "Ürün seçimi zorunludur")]
        public int ProductId { get; set; }

        public int? ReservationId { get; set; }

        [Range(1, 1000, ErrorMessage = "Miktar 1-1000 arasında olmalıdır")]
        public int Quantity { get; set; }

        [Range(0.01, 10000, ErrorMessage = "Birim fiyat 0.01-10000 arasında olmalıdır")]
        public decimal UnitPrice { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class SaleSearchDto
    {
        public int? ProductId { get; set; }
        public int? ReservationId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
