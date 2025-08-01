using System.ComponentModel.DataAnnotations;

namespace PansiyonYonetimSistemi.API.DTOs
{
    public class CustomerDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? TCKimlikNo { get; set; }
        public string? PassportNo { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Address { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string FullName => $"{FirstName} {LastName}";
    }

    public class CreateCustomerDto
    {
        [Required(ErrorMessage = "Ad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Ad en fazla 100 karakter olabilir")]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Soyad alanı zorunludur")]
        [StringLength(100, ErrorMessage = "Soyad en fazla 100 karakter olabilir")]
        public string LastName { get; set; } = string.Empty;

        [StringLength(11, ErrorMessage = "TC Kimlik No en fazla 11 haneli olabilir")]
        public string? TCKimlikNo { get; set; }

        [StringLength(50, ErrorMessage = "Pasaport No en fazla 50 karakter olabilir")]
        public string? PassportNo { get; set; }

        [StringLength(15, ErrorMessage = "Telefon en fazla 15 karakter olabilir")]
        public string? Phone { get; set; }

        [EmailAddress(ErrorMessage = "Geçerli bir email adresi giriniz")]
        [StringLength(100, ErrorMessage = "Email en fazla 100 karakter olabilir")]
        public string? Email { get; set; }

        [StringLength(500, ErrorMessage = "Adres en fazla 500 karakter olabilir")]
        public string? Address { get; set; }

        [StringLength(100, ErrorMessage = "Şehir en fazla 100 karakter olabilir")]
        public string? City { get; set; }

        [StringLength(100, ErrorMessage = "Ülke en fazla 100 karakter olabilir")]
        public string? Country { get; set; }

        public DateTime? DateOfBirth { get; set; }
    }

    public class UpdateCustomerDto : CreateCustomerDto
    {
        public int Id { get; set; }
    }

    public class CustomerSearchDto
    {
        public string? Name { get; set; }
        public string? TCKimlikNo { get; set; }
        public string? PassportNo { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? City { get; set; }
        public string? Country { get; set; }
    }
}
