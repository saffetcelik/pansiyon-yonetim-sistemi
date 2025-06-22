using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class ExpenseDto
    {
        public int Id { get; set; }
        public string ExpenseNumber { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public ExpenseCategory Category { get; set; }
        public string CategoryName => GetCategoryName(Category);
        public ExpenseStatus Status { get; set; }
        public string StatusName => GetStatusName(Status);
        public decimal Amount { get; set; }
        public PaymentMethod? PaymentMethod { get; set; }
        public string? PaymentMethodName => PaymentMethod?.ToString();
        public string? Vendor { get; set; }
        public string? InvoiceNumber { get; set; }
        public DateTime ExpenseDate { get; set; }
        public DateTime? PaymentDate { get; set; }
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
        public string? AttachmentPath { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public int? ApprovedByUserId { get; set; }
        public string? ApprovedByUserName { get; set; }
        public DateTime CreatedAt { get; set; }
        public bool IsOverdue => DueDate.HasValue && DueDate < DateTime.Today && Status != ExpenseStatus.Paid;

        private static string GetCategoryName(ExpenseCategory category)
        {
            return category switch
            {
                ExpenseCategory.Utilities => "Faturalar",
                ExpenseCategory.Maintenance => "Bakım-Onarım",
                ExpenseCategory.Supplies => "Malzeme",
                ExpenseCategory.Staff => "Personel",
                ExpenseCategory.Marketing => "Pazarlama",
                ExpenseCategory.Insurance => "Sigorta",
                ExpenseCategory.Tax => "Vergi",
                ExpenseCategory.Rent => "Kira",
                ExpenseCategory.Food => "Yiyecek-İçecek",
                ExpenseCategory.Cleaning => "Temizlik",
                ExpenseCategory.Other => "Diğer",
                _ => "Bilinmeyen"
            };
        }

        private static string GetStatusName(ExpenseStatus status)
        {
            return status switch
            {
                ExpenseStatus.Pending => "Beklemede",
                ExpenseStatus.Approved => "Onaylandı",
                ExpenseStatus.Paid => "Ödendi",
                ExpenseStatus.Rejected => "Reddedildi",
                ExpenseStatus.Cancelled => "İptal",
                _ => "Bilinmeyen"
            };
        }
    }

    public class CreateExpenseDto
    {
        [Required(ErrorMessage = "Başlık zorunludur")]
        [StringLength(200, ErrorMessage = "Başlık en fazla 200 karakter olabilir")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olabilir")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Kategori seçimi zorunludur")]
        public ExpenseCategory Category { get; set; }

        [Required(ErrorMessage = "Tutar belirtilmelidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0.01 veya daha fazla olmalıdır")]
        public decimal Amount { get; set; }

        [StringLength(200, ErrorMessage = "Tedarikçi adı en fazla 200 karakter olabilir")]
        public string? Vendor { get; set; }

        [StringLength(100, ErrorMessage = "Fatura numarası en fazla 100 karakter olabilir")]
        public string? InvoiceNumber { get; set; }

        public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

        public DateTime? DueDate { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class UpdateExpenseDto
    {
        [Required(ErrorMessage = "Başlık zorunludur")]
        [StringLength(200, ErrorMessage = "Başlık en fazla 200 karakter olabilir")]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Açıklama en fazla 1000 karakter olabilir")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Kategori seçimi zorunludur")]
        public ExpenseCategory Category { get; set; }

        [Required(ErrorMessage = "Tutar belirtilmelidir")]
        [Range(0.01, double.MaxValue, ErrorMessage = "Tutar 0.01 veya daha fazla olmalıdır")]
        public decimal Amount { get; set; }

        [StringLength(200, ErrorMessage = "Tedarikçi adı en fazla 200 karakter olabilir")]
        public string? Vendor { get; set; }

        [StringLength(100, ErrorMessage = "Fatura numarası en fazla 100 karakter olabilir")]
        public string? InvoiceNumber { get; set; }

        public DateTime ExpenseDate { get; set; }

        public DateTime? DueDate { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class ApproveExpenseDto
    {
        [Required(ErrorMessage = "Onay durumu belirtilmelidir")]
        public bool Approved { get; set; }

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class PayExpenseDto
    {
        [Required(ErrorMessage = "Ödeme yöntemi seçimi zorunludur")]
        public PaymentMethod PaymentMethod { get; set; }

        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [StringLength(500, ErrorMessage = "Notlar en fazla 500 karakter olabilir")]
        public string? Notes { get; set; }
    }

    public class ExpenseSearchDto
    {
        public ExpenseCategory? Category { get; set; }
        public ExpenseStatus? Status { get; set; }
        public string? Vendor { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal? MinAmount { get; set; }
        public decimal? MaxAmount { get; set; }
        public bool? IsOverdue { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class ExpenseSummaryDto
    {
        public decimal TotalAmount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal PendingAmount { get; set; }
        public decimal OverdueAmount { get; set; }
        public int TotalCount { get; set; }
        public int PaidCount { get; set; }
        public int PendingCount { get; set; }
        public int OverdueCount { get; set; }
        public DateTime Date { get; set; }
        public Dictionary<string, decimal> CategoryBreakdown { get; set; } = new();
    }
}
