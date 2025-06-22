using System.ComponentModel.DataAnnotations;

namespace PansiyonYonetimSistemi.API.Models
{
    public enum UserRole
    {
        Admin = 0,          // Yönetici
        Manager = 1,        // Müdür
        Receptionist = 2,   // Resepsiyon
        Staff = 3           // Personel
    }

    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(50)]
        public string Username { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        public UserRole Role { get; set; } = UserRole.Staff;
        
        [StringLength(15)]
        public string? Phone { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime? LastLoginDate { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation Properties
        public virtual ICollection<Log> Logs { get; set; } = new List<Log>();
    }
}
