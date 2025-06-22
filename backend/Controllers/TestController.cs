using Microsoft.AspNetCore.Mvc;
using PansiyonYonetimSistemi.API.Data;
using Microsoft.EntityFrameworkCore;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public TestController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { 
                status = "healthy", 
                timestamp = DateTime.UtcNow,
                message = "Güneş Pansiyon Yönetim Sistemi API çalışıyor!"
            });
        }

        [HttpGet("database")]
        public async Task<IActionResult> DatabaseCheck()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();
                var roomCount = await _context.Rooms.CountAsync();
                var userCount = await _context.Users.CountAsync();
                var productCount = await _context.Products.CountAsync();

                return Ok(new { 
                    canConnect,
                    roomCount,
                    userCount,
                    productCount,
                    message = "Veritabanı bağlantısı başarılı!"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { 
                    error = ex.Message,
                    message = "Veritabanı bağlantısında hata!"
                });
            }
        }

        [HttpGet("rooms")]
        public async Task<IActionResult> GetRooms()
        {
            try
            {
                var rooms = await _context.Rooms
                    .Select(r => new {
                        r.Id,
                        r.RoomNumber,
                        r.Type,
                        r.Status,
                        r.Capacity,
                        r.PricePerNight
                    })
                    .ToListAsync();

                return Ok(rooms);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Select(u => new
                    {
                        u.Id,
                        u.Username,
                        u.Email,
                        u.FirstName,
                        u.LastName,
                        u.Role,
                        u.IsActive,
                        PasswordHashLength = u.PasswordHash.Length
                    })
                    .ToListAsync();

                return Ok(new
                {
                    status = "success",
                    users,
                    message = "Kullanıcılar listelendi"
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    status = "error",
                    message = "Kullanıcılar listelenemedi",
                    error = ex.Message
                });
            }
        }
    }
}
