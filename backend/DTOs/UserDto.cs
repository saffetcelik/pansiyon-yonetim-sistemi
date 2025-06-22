using System.ComponentModel.DataAnnotations;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string RoleName => Role.ToString();
        public string? Phone { get; set; }
        public bool IsActive { get; set; }
        public DateTime? LastLoginDate { get; set; }
        public string FullName => $"{FirstName} {LastName}";
    }

    public class CreateUserDto
    {
        [Required(ErrorMessage = "Kullanıcı adı zorunludur")]
        [StringLength(50, ErrorMessage = "Kullanıcı adı en fazla 50 karakter olabilir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Ad en fazla 100 karakter olabilir")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Soyad en fazla 100 karakter olabilir")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email alanı zorunludur")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        [StringLength(100, ErrorMessage = "Email en fazla 100 karakter olabilir")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rol seçimi zorunludur")]
        public UserRole Role { get; set; }

        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
        [StringLength(15, ErrorMessage = "Telefon en fazla 15 karakter olabilir")]
        public string? Phone { get; set; }

        public bool IsActive { get; set; } = true;
    }

    public class UpdateUserDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Kullanıcı adı zorunludur")]
        [StringLength(50, ErrorMessage = "Kullanıcı adı en fazla 50 karakter olabilir")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Ad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Ad en fazla 100 karakter olabilir")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Soyad en fazla 100 karakter olabilir")]
        public string LastName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email alanı zorunludur")]
        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        [StringLength(100, ErrorMessage = "Email en fazla 100 karakter olabilir")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Rol seçimi zorunludur")]
        public UserRole Role { get; set; }

        [Phone(ErrorMessage = "Geçerli bir telefon numarası giriniz")]
        [StringLength(15, ErrorMessage = "Telefon en fazla 15 karakter olabilir")]
        public string? Phone { get; set; }

        public bool IsActive { get; set; }
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "Kullanıcı adı zorunludur")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre zorunludur")]
        public string Password { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }

    public class ChangePasswordDto
    {
        public int UserId { get; set; }

        [Required(ErrorMessage = "Mevcut şifre zorunludur")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Yeni şifre zorunludur")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Şifre en az 6 karakter olmalıdır")]
        public string NewPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "Şifre tekrarı zorunludur")]
        [Compare("NewPassword", ErrorMessage = "Şifreler eşleşmiyor")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }
}
