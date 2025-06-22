using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum LogLevel
    {
        Info = 0,           // Bilgi
        Warning = 1,        // Uyarı
        Error = 2,          // Hata
        Critical = 3        // Kritik
    }

    public class Log
    {
        public int Id { get; set; }
        
        public int? UserId { get; set; }
        
        public LogLevel Level { get; set; }
        
        [Required]
        [StringLength(200)]
        public string Action { get; set; } = string.Empty;
        
        [StringLength(1000)]
        public string? Description { get; set; }
        
        [StringLength(50)]
        public string? IPAddress { get; set; }
        
        [StringLength(500)]
        public string? UserAgent { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation Properties
        [ForeignKey("UserId")]
        public virtual User? User { get; set; }
    }
}
