using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        bool ValidateToken(string token);
        int? GetUserIdFromToken(string token);
        string RefreshToken(string token);
    }
}
