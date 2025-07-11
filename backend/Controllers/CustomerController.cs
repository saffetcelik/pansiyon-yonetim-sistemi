using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/customers")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CustomerController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomers([FromQuery] CustomerSearchDto searchDto)
        {
            try
            {
                var query = _context.Customers.AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(searchDto.Name))
                {
                    query = query.Where(c => 
                        c.FirstName.Contains(searchDto.Name) ||
                        c.LastName.Contains(searchDto.Name));
                }

                if (!string.IsNullOrEmpty(searchDto.TCKimlikNo))
                {
                    query = query.Where(c => c.TCKimlikNo != null && c.TCKimlikNo.Contains(searchDto.TCKimlikNo));
                }

                if (!string.IsNullOrEmpty(searchDto.PassportNo))
                {
                    query = query.Where(c => c.PassportNo != null && c.PassportNo.Contains(searchDto.PassportNo));
                }

                if (!string.IsNullOrEmpty(searchDto.Phone))
                {
                    query = query.Where(c => c.Phone != null && c.Phone.Contains(searchDto.Phone));
                }

                if (!string.IsNullOrEmpty(searchDto.Email))
                {
                    query = query.Where(c => c.Email != null && c.Email.Contains(searchDto.Email));
                }

                if (!string.IsNullOrEmpty(searchDto.City))
                {
                    query = query.Where(c => c.City != null && c.City.Contains(searchDto.City));
                }

                if (!string.IsNullOrEmpty(searchDto.Country))
                {
                    query = query.Where(c => c.Country != null && c.Country.Contains(searchDto.Country));
                }

                var totalCount = await query.CountAsync();
                
                var customers = await query
                    .OrderBy(c => c.FirstName)
                    .ThenBy(c => c.LastName)
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .ToListAsync();

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);

                return Ok(new
                {
                    data = customerDtos,
                    totalCount,
                    page = searchDto.Page,
                    pageSize = searchDto.PageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteriler getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCustomer(int id)
        {
            try
            {
                var customer = await _context.Customers
                    .Include(c => c.Reservations)
                    .ThenInclude(r => r.Room)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                {
                    return NotFound(new { message = "Müşteri bulunamadı" });
                }

                var customerDto = _mapper.Map<CustomerDto>(customer);
                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost]
        // [Authorize(Roles = "Admin,Manager")] // Geçici olarak kaldırıldı
        public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto createCustomerDto)
        {
            try
            {
                Console.WriteLine($"CreateCustomer called with data: {System.Text.Json.JsonSerializer.Serialize(createCustomerDto)}");

                if (!ModelState.IsValid)
                {
                    Console.WriteLine("ModelState is invalid:");
                    foreach (var error in ModelState)
                    {
                        Console.WriteLine($"Key: {error.Key}, Errors: {string.Join(", ", error.Value.Errors.Select(e => e.ErrorMessage))}");
                    }
                    return BadRequest(ModelState);
                }

                // Check if customer with same TC or Passport already exists
                if (!string.IsNullOrEmpty(createCustomerDto.TCKimlikNo))
                {
                    var existingCustomerByTC = await _context.Customers
                        .FirstOrDefaultAsync(c => c.TCKimlikNo == createCustomerDto.TCKimlikNo);

                    if (existingCustomerByTC != null)
                    {
                        return BadRequest(new { message = "Bu TC Kimlik No ile kayıtlı müşteri zaten mevcut" });
                    }
                }

                if (!string.IsNullOrEmpty(createCustomerDto.PassportNo))
                {
                    var existingCustomerByPassport = await _context.Customers
                        .FirstOrDefaultAsync(c => c.PassportNo == createCustomerDto.PassportNo);

                    if (existingCustomerByPassport != null)
                    {
                        return BadRequest(new { message = "Bu Pasaport No ile kayıtlı müşteri zaten mevcut" });
                    }
                }

                var customer = _mapper.Map<Customer>(createCustomerDto);
                customer.CreatedAt = DateTime.UtcNow;

                Console.WriteLine($"Mapped customer: {System.Text.Json.JsonSerializer.Serialize(customer)}");

                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();

                var customerDto = _mapper.Map<CustomerDto>(customer);
                return CreatedAtAction(nameof(GetCustomer), new { id = customer.Id }, customerDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"CreateCustomer Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Müşteri oluşturulurken hata oluştu", error = ex.Message, details = ex.StackTrace });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateCustomerDto updateCustomerDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = "Müşteri bulunamadı" });
                }

                // Check if customer with same TC or Passport already exists (excluding current customer)
                if (!string.IsNullOrEmpty(updateCustomerDto.TCKimlikNo))
                {
                    var existingCustomerByTC = await _context.Customers
                        .FirstOrDefaultAsync(c => c.TCKimlikNo == updateCustomerDto.TCKimlikNo && c.Id != id);

                    if (existingCustomerByTC != null)
                    {
                        return BadRequest(new { message = "Bu TC Kimlik No ile kayıtlı başka bir müşteri mevcut" });
                    }
                }

                if (!string.IsNullOrEmpty(updateCustomerDto.PassportNo))
                {
                    var existingCustomerByPassport = await _context.Customers
                        .FirstOrDefaultAsync(c => c.PassportNo == updateCustomerDto.PassportNo && c.Id != id);

                    if (existingCustomerByPassport != null)
                    {
                        return BadRequest(new { message = "Bu Pasaport No ile kayıtlı başka bir müşteri mevcut" });
                    }
                }

                _mapper.Map(updateCustomerDto, customer);
                customer.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var customerDto = _mapper.Map<CustomerDto>(customer);
                return Ok(customerDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateCustomer Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Müşteri güncellenirken hata oluştu", error = ex.Message, details = ex.StackTrace });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            try
            {
                var customer = await _context.Customers
                    .Include(c => c.Reservations)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                {
                    return NotFound(new { message = "Müşteri bulunamadı" });
                }

                // Check if customer has any active reservations
                var hasActiveReservations = customer.Reservations.Any(r => 
                    r.Status == ReservationStatus.Confirmed || 
                    r.Status == ReservationStatus.CheckedIn ||
                    r.Status == ReservationStatus.Pending);

                if (hasActiveReservations)
                {
                    return BadRequest(new { message = "Bu müşterinin aktif rezervasyonları bulunduğu için silinemez" });
                }

                _context.Customers.Remove(customer);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Müşteri başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri silinirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchCustomers([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrEmpty(query) || query.Length < 2)
                {
                    return Ok(new List<CustomerDto>());
                }

                // Büyük/küçük harf duyarsız arama için ToLower kullan
                var lowerQuery = query.ToLower();

                var customers = await _context.Customers
                    .Where(c =>
                        c.FirstName.ToLower().Contains(lowerQuery) ||
                        c.LastName.ToLower().Contains(lowerQuery) ||
                        (c.TCKimlikNo != null && c.TCKimlikNo.Contains(query)) ||
                        (c.PassportNo != null && c.PassportNo.ToLower().Contains(lowerQuery)) ||
                        (c.Phone != null && c.Phone.Contains(query)) ||
                        (c.Email != null && c.Email.ToLower().Contains(lowerQuery)))
                    .OrderBy(c => c.FirstName)
                    .ThenBy(c => c.LastName)
                    .Take(10)
                    .ToListAsync();

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);
                return Ok(customerDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müşteri arama sırasında hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentCustomers([FromQuery] int count = 10)
        {
            try
            {
                var customers = await _context.Customers
                    .OrderByDescending(c => c.CreatedAt)
                    .Take(count)
                    .ToListAsync();

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);
                return Ok(customerDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Son müşteriler getirilirken hata oluştu", error = ex.Message });
            }
        }
    }
}
