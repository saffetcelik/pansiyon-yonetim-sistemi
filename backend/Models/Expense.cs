using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum ExpenseCategory
    {
        Utilities = 0,      // Faturalar (elektrik, su, gaz)
        Maintenance = 1,    // Bakım-onarım
        Supplies = 2,       // Malzeme alımı
        Staff = 3,          // Personel giderleri
        Marketing = 4,      // Pazarlama
        Insurance = 5,      // Sigorta
        Tax = 6,           // Vergi
        Rent = 7,          // Kira
        Food = 8,          // Yiyecek-içecek
        Cleaning = 9,      // Temizlik
        Other = 10         // Diğer
    }

    public enum ExpenseStatus
    {
        Pending = 0,       // Beklemede
        Approved = 1,      // Onaylandı
        Paid = 2,          // Ödendi
        Rejected = 3,      // Reddedildi
        Cancelled = 4      // İptal edildi
    }

    public class Expense
    {
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string ExpenseNumber { get; set; } = string.Empty; // EXP-2024-0001

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        public ExpenseCategory Category { get; set; }

        public ExpenseStatus Status { get; set; } = ExpenseStatus.Pending;

        [Column(TypeName = "decimal(10,2)")]
        public decimal Amount { get; set; }

        public PaymentMethod? PaymentMethod { get; set; }

        [StringLength(200)]
        public string? Vendor { get; set; } // Tedarikçi/Satıcı

        [StringLength(100)]
        public string? InvoiceNumber { get; set; } // Fatura numarası

        public DateTime ExpenseDate { get; set; } = DateTime.UtcNow;

        public DateTime? PaymentDate { get; set; }

        public DateTime? DueDate { get; set; } // Vade tarihi

        [StringLength(500)]
        public string? Notes { get; set; }

        [StringLength(500)]
        public string? AttachmentPath { get; set; } // Fatura/fiş dosya yolu

        // Foreign Keys
        public int? UserId { get; set; } // Gideri kaydeden kullanıcı
        public int? ApprovedByUserId { get; set; } // Onaylayan kullanıcı

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        [ForeignKey("ApprovedByUserId")]
        public virtual User? ApprovedByUser { get; set; }
    }
}
