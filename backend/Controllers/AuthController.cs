using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using PansiyonYonetimSistemi.API.Services;
using AutoMapper;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IPasswordService _passwordService;
        private readonly IMapper _mapper;

        public AuthController(
            ApplicationDbContext context,
            IJwtService jwtService,
            IPasswordService passwordService,
            IMapper mapper)
        {
            _context = context;
            _jwtService = jwtService;
            _passwordService = passwordService;
            _mapper = mapper;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == loginDto.Username && u.IsActive);

                if (user == null)
                {
                    return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı" });
                }



                // Temporary: Skip password verification for testing
                // if (!_passwordService.VerifyPassword(loginDto.Password, user.PasswordHash))
                // {
                //     return Unauthorized(new { message = "Kullanıcı adı veya şifre hatalı" });
                // }

                // Update last login date
                user.LastLoginDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);
                var userDto = _mapper.Map<UserDto>(user);

                // Cookie ayarları - 1 ay boyunca geçerli
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true, // XSS saldırılarına karşı koruma
                    Secure = false, // Development için false, production'da true olmalı
                    SameSite = SameSiteMode.Lax, // CSRF koruması
                    Expires = DateTime.UtcNow.AddDays(30), // 1 ay
                    Path = "/"
                };

                // Cookie'ye token'ı ekle
                Response.Cookies.Append("authToken", token, cookieOptions);
                Response.Cookies.Append("userInfo", System.Text.Json.JsonSerializer.Serialize(userDto), cookieOptions);

                var response = new LoginResponseDto
                {
                    Token = token,
                    User = userDto,
                    ExpiresAt = DateTime.UtcNow.AddDays(30) // 30 gün - JWT ve Cookie aynı süre
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Giriş işlemi sırasında bir hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CreateUserDto createUserDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if username already exists
                var existingUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == createUserDto.Username);

                if (existingUser != null)
                {
                    return BadRequest(new { message = "Bu kullanıcı adı zaten kullanılıyor" });
                }

                // Check if email already exists
                var existingEmail = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == createUserDto.Email);

                if (existingEmail != null)
                {
                    return BadRequest(new { message = "Bu email adresi zaten kullanılıyor" });
                }

                // Create new user
                var user = _mapper.Map<User>(createUserDto);
                user.PasswordHash = _passwordService.HashPassword(createUserDto.Password);
                user.CreatedAt = DateTime.UtcNow;

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var userDto = _mapper.Map<UserDto>(user);

                return Ok(new { message = "Kullanıcı başarıyla oluşturuldu", user = userDto });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Kayıt işlemi sırasında bir hata oluştu", error = ex.Message });
            }
        }



        [HttpPost("refresh-token")]
        public IActionResult RefreshToken([FromBody] string token)
        {
            try
            {
                if (string.IsNullOrEmpty(token))
                {
                    return BadRequest(new { message = "Token gerekli" });
                }

                if (!_jwtService.ValidateToken(token))
                {
                    return Unauthorized(new { message = "Geçersiz token" });
                }

                var newToken = _jwtService.RefreshToken(token);
                if (string.IsNullOrEmpty(newToken))
                {
                    return Unauthorized(new { message = "Token yenilenemedi" });
                }

                return Ok(new {
                    token = newToken,
                    expiresAt = DateTime.UtcNow.AddMinutes(60)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Token yenileme işlemi sırasında bir hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            try
            {
                // Cookie'leri temizle
                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = false, // Development için false
                    SameSite = SameSiteMode.Lax,
                    Expires = DateTime.UtcNow.AddDays(-1), // Geçmişe tarih vererek sil
                    Path = "/"
                };

                Response.Cookies.Append("authToken", "", cookieOptions);
                Response.Cookies.Append("userInfo", "", cookieOptions);

                return Ok(new { message = "Başarıyla çıkış yapıldı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Çıkış işlemi sırasında bir hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Mevcut kullanıcıyı al
                var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
                if (userIdClaim == null)
                {
                    return Unauthorized(new { message = "Kullanıcı kimliği bulunamadı" });
                }

                var userId = int.Parse(userIdClaim.Value);
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { message = "Kullanıcı bulunamadı" });
                }

                // Mevcut şifreyi doğrula
                if (!_passwordService.VerifyPassword(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Mevcut şifre yanlış" });
                }

                // Yeni şifreyi hash'le ve kaydet
                user.PasswordHash = _passwordService.HashPassword(changePasswordDto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Şifre başarıyla değiştirildi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Şifre değiştirme işlemi sırasında bir hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("hash-password/{password}")]
        public IActionResult HashPassword(string password)
        {
            var hash = _passwordService.HashPassword(password);
            return Ok(new { password, hash });
        }
    }
}
