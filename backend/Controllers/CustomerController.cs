using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;

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
                Console.WriteLine($"GetCustomers called with searchDto: {System.Text.Json.JsonSerializer.Serialize(searchDto)}");

                // LINQ ile sadece dolu alanları AND ile filtrele
                IQueryable<Customer> customersQuery = _context.Customers;

                // Eğer hem FirstName hem LastName doluysa, ikisini de AND ile uygula
                if (!string.IsNullOrEmpty(searchDto.FirstName) && !string.IsNullOrEmpty(searchDto.LastName))
                {
                    customersQuery = customersQuery.Where(c =>
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.FirstName.ToLower()),
                            EF.Functions.Unaccent("%" + searchDto.FirstName.ToLower() + "%")
                        ) &&
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.LastName.ToLower()),
                            EF.Functions.Unaccent("%" + searchDto.LastName.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added FirstName AND LastName filter: {searchDto.FirstName} {searchDto.LastName}");
                }
                else if (!string.IsNullOrEmpty(searchDto.FirstName))
                {
                    customersQuery = customersQuery.Where(c =>
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.FirstName.ToLower()),
                            EF.Functions.Unaccent("%" + searchDto.FirstName.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added FirstName filter: {searchDto.FirstName}");
                }
                else if (!string.IsNullOrEmpty(searchDto.LastName))
                {
                    customersQuery = customersQuery.Where(c =>
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.LastName.ToLower()),
                            EF.Functions.Unaccent("%" + searchDto.LastName.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added LastName filter: {searchDto.LastName}");
                }

                // Name parametresi varsa, hem ad hem de soyad için AND ile arama yap
                if (!string.IsNullOrEmpty(searchDto.Name))
                {
                    var nameParts = searchDto.Name.Split(' ', StringSplitOptions.RemoveEmptyEntries);
                    if (nameParts.Length == 2)
                    {
                        string first = nameParts[0];
                        string last = nameParts[1];
                        customersQuery = customersQuery.Where(c =>
                            EF.Functions.ILike(
                                EF.Functions.Unaccent(c.FirstName.ToLower()),
                                EF.Functions.Unaccent("%" + first.ToLower() + "%")
                            ) &&
                            EF.Functions.ILike(
                                EF.Functions.Unaccent(c.LastName.ToLower()),
                                EF.Functions.Unaccent("%" + last.ToLower() + "%")
                            )
                        );
                        Console.WriteLine($"Added Name filter as AND: {first} {last}");
                    }
                    else
                    {
                        // Tek parça ise hem ad hem soyad içinde arama (OR)
                        customersQuery = customersQuery.Where(c =>
                            EF.Functions.ILike(
                                EF.Functions.Unaccent(c.FirstName.ToLower()),
                                EF.Functions.Unaccent("%" + searchDto.Name.ToLower() + "%")
                            ) ||
                            EF.Functions.ILike(
                                EF.Functions.Unaccent(c.LastName.ToLower()),
                                EF.Functions.Unaccent("%" + searchDto.Name.ToLower() + "%")
                            )
                        );
                        Console.WriteLine($"Added Name filter as OR: {searchDto.Name}");
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.TCKimlikNo))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.TCKimlikNo != null && 
                        c.TCKimlikNo.Contains(searchDto.TCKimlikNo)
                    );
                    Console.WriteLine($"Added TCKimlikNo filter: {searchDto.TCKimlikNo}");
                }

                if (!string.IsNullOrEmpty(searchDto.PassportNo))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.PassportNo != null && 
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.PassportNo.ToLower()), 
                            EF.Functions.Unaccent("%" + searchDto.PassportNo.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added PassportNo filter: {searchDto.PassportNo}");
                }

                if (!string.IsNullOrEmpty(searchDto.Phone))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.Phone != null && 
                        c.Phone.Contains(searchDto.Phone)
                    );
                    Console.WriteLine($"Added Phone filter: {searchDto.Phone}");
                }

                if (!string.IsNullOrEmpty(searchDto.Email))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.Email != null && 
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.Email.ToLower()), 
                            EF.Functions.Unaccent("%" + searchDto.Email.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added Email filter: {searchDto.Email}");
                }

                if (!string.IsNullOrEmpty(searchDto.City))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.City != null && 
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.City.ToLower()), 
                            EF.Functions.Unaccent("%" + searchDto.City.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added City filter: {searchDto.City}");
                }

                if (!string.IsNullOrEmpty(searchDto.Country))
                {
                    customersQuery = customersQuery.Where(c => 
                        c.Country != null && 
                        EF.Functions.ILike(
                            EF.Functions.Unaccent(c.Country.ToLower()), 
                            EF.Functions.Unaccent("%" + searchDto.Country.ToLower() + "%")
                        )
                    );
                    Console.WriteLine($"Added Country filter: {searchDto.Country}");
                }

                // Sıralama ekleyelim
                var orderedQuery = customersQuery.OrderBy(c => c.FirstName).ThenBy(c => c.LastName);
                
                // Debug için oluşturulan SQL'i yazdıralım
                string generatedSql = orderedQuery.ToQueryString();
                Console.WriteLine($"Generated SQL: {generatedSql}");
                
                // Sorguyu çalıştır
                var customers = await orderedQuery.ToListAsync();

                Console.WriteLine($"Found {customers.Count} customers");

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);

                return Ok(new { data = customerDtos });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in CustomerController.GetCustomers: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
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
                    .Include(c => c.ReservationCustomers)
                        .ThenInclude(rc => rc.Reservation)
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (customer == null)
                {
                    return NotFound(new { message = "Müşteri bulunamadı" });
                }

                // Check if customer has any active reservations (as primary customer)
                var hasActiveReservations = customer.Reservations.Any(r =>
                    r.Status == ReservationStatus.Confirmed ||
                    r.Status == ReservationStatus.CheckedIn ||
                    r.Status == ReservationStatus.Pending);

                // Check if customer is part of any active reservations (as additional customer)
                var hasActiveReservationCustomers = customer.ReservationCustomers.Any(rc =>
                    rc.Reservation.Status == ReservationStatus.Confirmed ||
                    rc.Reservation.Status == ReservationStatus.CheckedIn ||
                    rc.Reservation.Status == ReservationStatus.Pending);

                if (hasActiveReservations || hasActiveReservationCustomers)
                {
                    return BadRequest(new { message = "Bu müşterinin aktif rezervasyonları bulunduğu için silinemez" });
                }

                // First remove all ReservationCustomer entries
                if (customer.ReservationCustomers.Any())
                {
                    _context.ReservationCustomers.RemoveRange(customer.ReservationCustomers);
                }

                // Then remove the customer
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

                // SQL sorgusu oluştur - Tüm alanlarda unaccent fonksiyonu kullanılıyor
                var sql = @"SELECT * FROM ""Customers"" 
                           WHERE unaccent(LOWER(""FirstName"")) LIKE unaccent(@p0)
                              OR unaccent(LOWER(""LastName"")) LIKE unaccent(@p0)
                              OR (""TCKimlikNo"" IS NOT NULL AND ""TCKimlikNo"" LIKE @p0)
                              OR (""PassportNo"" IS NOT NULL AND unaccent(LOWER(""PassportNo"")) LIKE unaccent(@p0))
                              OR (""Phone"" IS NOT NULL AND ""Phone"" LIKE @p0)
                              OR (""Email"" IS NOT NULL AND unaccent(LOWER(""Email"")) LIKE unaccent(@p0))
                           ORDER BY ""FirstName"", ""LastName""";
                
                var searchTerm = "%" + query.ToLower() + "%";
                Console.WriteLine($"Genel arama sorgusu: {sql} with param: {searchTerm}");
                
                // SQL'i çalıştır
                var customers = await _context.Customers
                    .FromSqlRaw(sql, searchTerm)
                    .OrderBy(c => c.FirstName)
                    .ThenBy(c => c.LastName)
                    .Take(10)
                    .ToListAsync();

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);
                return Ok(new { data = customerDtos });
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
                return Ok(new { data = customerDtos });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Son müşteriler getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}/reservation-check")]
        public async Task<IActionResult> CheckCustomerReservations(int id)
        {
            try
            {
                // Müşteriyi bul
                var customer = await _context.Customers.FindAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = "Müşteri bulunamadı" });
                }

                // Müşterinin rezervasyonlarını kontrol et (doğrudan ilişkili olanlar)
                var directReservations = await _context.Reservations
                    .Where(r => r.CustomerId == id)
                    .ToListAsync();

                // ReservationCustomers ilişkisi üzerinden müşterinin rezervasyonlarını kontrol et
                var relatedReservations = await _context.ReservationCustomers
                    .Where(rc => rc.CustomerId == id)
                    .Include(rc => rc.Reservation)
                    .Select(rc => rc.Reservation)
                    .ToListAsync();

                // Tüm rezervasyonları birleştir
                var allReservations = directReservations
                    .Union(relatedReservations)
                    .Where(r => r != null)
                    .ToList();

                // Rezervasyon varsa bilgileri döndür
                if (allReservations.Any())
                {
                    var reservationData = allReservations.Select(r => new
                    {
                        id = r.Id,
                        roomNumber = _context.Rooms.FirstOrDefault(rm => rm.Id == r.RoomId)?.RoomNumber,
                        checkInDate = r.CheckInDate,
                        checkOutDate = r.CheckOutDate,
                        status = r.Status,
                        isActive = r.Status == ReservationStatus.CheckedIn
                                   || r.Status == ReservationStatus.Confirmed
                                   || r.Status == ReservationStatus.Pending
                    }).ToList();

                    // Aktif ve geçmiş rezervasyonları ayır
                    var activeReservations = reservationData.Where(r => r.isActive).ToList();
                    var pastReservations = reservationData.Where(r => !r.isActive).ToList();

                    return Ok(new
                    {
                        hasReservations = true,
                        reservationCount = reservationData.Count,
                        activeReservationCount = activeReservations.Count,
                        pastReservationCount = pastReservations.Count,
                        reservations = reservationData
                    });
                }

                // Rezervasyon yoksa silinebilir
                return Ok(new { hasReservations = false });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rezervasyon kontrolü yapılırken hata oluştu", error = ex.Message });
            }
        }
    }
}
