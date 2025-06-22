using System.Security.Cryptography;
using System.Text;

namespace PansiyonYonetimSistemi.API.Services
{
    public class PasswordService : IPasswordService
    {
        public string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                // Add salt to make it more secure
                var saltedPassword = password + "PansiyonYonetimSistemi_Salt_2024";
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(saltedPassword));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        public bool VerifyPassword(string password, string hashedPassword)
        {
            var hashOfInput = HashPassword(password);
            return hashOfInput.Equals(hashedPassword);
        }
    }
}
