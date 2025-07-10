using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using PansiyonYonetimSistemi.API.Attributes;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/reservations")]
    [Authorize]
    public class ReservationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ReservationController> _logger;

        public ReservationController(ApplicationDbContext context, IMapper mapper, ILogger<ReservationController> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> GetReservations([FromQuery] ReservationSearchDto searchDto)
        {
            try
            {
                Console.WriteLine($"GetReservations called with: Status={searchDto.Status}, ExcludeCheckedOut={searchDto.ExcludeCheckedOut}");
                var query = _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .Include(r => r.ReservationCustomers)
                        .ThenInclude(rc => rc.Customer)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(searchDto.CustomerName))
                {
                    query = query.Where(r => 
                        r.Customer.FirstName.Contains(searchDto.CustomerName) ||
                        r.Customer.LastName.Contains(searchDto.CustomerName));
                }

                if (!string.IsNullOrEmpty(searchDto.RoomNumber))
                {
                    query = query.Where(r => r.Room.RoomNumber.Contains(searchDto.RoomNumber));
                }

                if (searchDto.CheckInDate.HasValue)
                {
                    query = query.Where(r => r.CheckInDate.Date >= searchDto.CheckInDate.Value.Date);
                }

                if (searchDto.CheckOutDate.HasValue)
                {
                    query = query.Where(r => r.CheckOutDate.Date <= searchDto.CheckOutDate.Value.Date);
                }

                if (searchDto.Status.HasValue)
                {
                    query = query.Where(r => r.Status == searchDto.Status.Value);
                }

                // Çıkış yapılanları hariç tut
                if (searchDto.ExcludeCheckedOut)
                {
                    Console.WriteLine("Excluding checked-out reservations");
                    query = query.Where(r => r.Status != ReservationStatus.CheckedOut);
                }
                else
                {
                    Console.WriteLine("Including all reservation statuses");
                }

                var totalCount = await query.CountAsync();
                
                var reservations = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((searchDto.Page - 1) * searchDto.PageSize)
                    .Take(searchDto.PageSize)
                    .Select(r => new ReservationDto
                    {
                        Id = r.Id,
                        CustomerId = r.CustomerId,
                        CustomerName = r.Customer.FirstName + " " + r.Customer.LastName,
                        RoomId = r.RoomId,
                        RoomNumber = r.Room.RoomNumber,
                        CheckInDate = r.CheckInDate,
                        CheckOutDate = r.CheckOutDate,
                        NumberOfGuests = r.NumberOfGuests,
                        TotalAmount = r.TotalAmount,
                        PaidAmount = r.PaidAmount,
                        Status = r.Status,
                        Notes = r.Notes,
                        ActualCheckInDate = r.ActualCheckInDate,
                        ActualCheckOutDate = r.ActualCheckOutDate,
                        Customers = r.ReservationCustomers
                            .OrderBy(rc => rc.OrderIndex)
                            .Select(rc => new ReservationCustomerDto
                            {
                                Id = rc.Id,
                                CustomerId = rc.CustomerId,
                                CustomerName = rc.Customer.FirstName + " " + rc.Customer.LastName,
                                TCKimlikNo = rc.Customer.TCKimlikNo,
                                Phone = rc.Customer.Phone,
                                Role = rc.Role,
                                OrderIndex = rc.OrderIndex
                            }).ToList()
                    })
                    .ToListAsync();

                return Ok(new
                {
                    data = reservations,
                    totalCount,
                    page = searchDto.Page,
                    pageSize = searchDto.PageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / searchDto.PageSize)
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rezervasyonlar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetReservation(int id)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .Include(r => r.ReservationCustomers)
                        .ThenInclude(rc => rc.Customer)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                var reservationDto = new ReservationDto
                {
                    Id = reservation.Id,
                    CustomerId = reservation.CustomerId,
                    CustomerName = reservation.Customer.FirstName + " " + reservation.Customer.LastName,
                    RoomId = reservation.RoomId,
                    RoomNumber = reservation.Room.RoomNumber,
                    CheckInDate = reservation.CheckInDate,
                    CheckOutDate = reservation.CheckOutDate,
                    NumberOfGuests = reservation.NumberOfGuests,
                    TotalAmount = reservation.TotalAmount,
                    PaidAmount = reservation.PaidAmount,
                    Status = reservation.Status,
                    Notes = reservation.Notes,
                    ActualCheckInDate = reservation.ActualCheckInDate,
                    ActualCheckOutDate = reservation.ActualCheckOutDate,
                    Customers = reservation.ReservationCustomers
                        .OrderBy(rc => rc.OrderIndex)
                        .Select(rc => new ReservationCustomerDto
                        {
                            Id = rc.Id,
                            CustomerId = rc.CustomerId,
                            CustomerName = rc.Customer.FirstName + " " + rc.Customer.LastName,
                            TCKimlikNo = rc.Customer.TCKimlikNo,
                            Phone = rc.Customer.Phone,
                            Role = rc.Role,
                            OrderIndex = rc.OrderIndex
                        }).ToList()
                };

                return Ok(reservationDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rezervasyon getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost]
        [ManagerOrAbove]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDto createReservationDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Validate dates
                if (createReservationDto.CheckInDate >= createReservationDto.CheckOutDate)
                {
                    return BadRequest(new { message = "Çıkış tarihi giriş tarihinden sonra olmalıdır" });
                }

                if (createReservationDto.CheckInDate < DateTime.Today)
                {
                    return BadRequest(new { message = "Giriş tarihi bugünden önce olamaz" });
                }

                // Check room availability
                var isRoomAvailable = await IsRoomAvailable(
                    createReservationDto.RoomId,
                    createReservationDto.CheckInDate,
                    createReservationDto.CheckOutDate);

                if (!isRoomAvailable)
                {
                    return BadRequest(new { message = "Seçilen tarihler için oda müsait değil" });
                }

                // Check if customer exists
                var customerExists = await _context.Customers.AnyAsync(c => c.Id == createReservationDto.CustomerId);
                if (!customerExists)
                {
                    return BadRequest(new { message = "Müşteri bulunamadı" });
                }

                // Check if room exists and get capacity
                var room = await _context.Rooms.FindAsync(createReservationDto.RoomId);
                if (room == null)
                {
                    return BadRequest(new { message = "Oda bulunamadı" });
                }

                // Validate customer list
                var customerIds = createReservationDto.CustomerIds?.Any() == true
                    ? createReservationDto.CustomerIds
                    : new List<int> { createReservationDto.CustomerId };

                // Remove duplicates and validate count
                customerIds = customerIds.Distinct().ToList();

                if (customerIds.Count > room.Capacity)
                {
                    return BadRequest(new { message = $"Müşteri sayısı ({customerIds.Count}) oda kapasitesini ({room.Capacity}) aşamaz" });
                }

                // Validate all customers exist
                var existingCustomerIds = await _context.Customers
                    .Where(c => customerIds.Contains(c.Id))
                    .Select(c => c.Id)
                    .ToListAsync();

                var missingCustomerIds = customerIds.Except(existingCustomerIds).ToList();
                if (missingCustomerIds.Any())
                {
                    return BadRequest(new { message = $"Şu müşteriler bulunamadı: {string.Join(", ", missingCustomerIds)}" });
                }

                var reservation = _mapper.Map<Reservation>(createReservationDto);
                reservation.CreatedAt = DateTime.UtcNow;
                reservation.Status = ReservationStatus.Pending;
                reservation.NumberOfGuests = customerIds.Count; // Müşteri sayısına göre güncelle

                _context.Reservations.Add(reservation);
                await _context.SaveChangesAsync();

                // Add customers to reservation
                for (int i = 0; i < customerIds.Count; i++)
                {
                    var reservationCustomer = new ReservationCustomer
                    {
                        ReservationId = reservation.Id,
                        CustomerId = customerIds[i],
                        Role = i == 0 ? "Primary" : "Guest", // İlk müşteri ana müşteri
                        OrderIndex = i,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.ReservationCustomers.Add(reservationCustomer);
                }

                await _context.SaveChangesAsync();

                // Get the created reservation with includes
                var createdReservation = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == reservation.Id);

                var reservationDto = new ReservationDto
                {
                    Id = createdReservation!.Id,
                    CustomerId = createdReservation.CustomerId,
                    CustomerName = createdReservation.Customer.FirstName + " " + createdReservation.Customer.LastName,
                    RoomId = createdReservation.RoomId,
                    RoomNumber = createdReservation.Room.RoomNumber,
                    CheckInDate = createdReservation.CheckInDate,
                    CheckOutDate = createdReservation.CheckOutDate,
                    NumberOfGuests = createdReservation.NumberOfGuests,
                    TotalAmount = createdReservation.TotalAmount,
                    PaidAmount = createdReservation.PaidAmount,
                    Status = createdReservation.Status,
                    Notes = createdReservation.Notes,
                    ActualCheckInDate = createdReservation.ActualCheckInDate,
                    ActualCheckOutDate = createdReservation.ActualCheckOutDate
                };

                return CreatedAtAction(nameof(GetReservation), new { id = reservation.Id }, reservationDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rezervasyon oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ManagerOrAbove]
        public async Task<IActionResult> UpdateReservation(int id, [FromBody] UpdateReservationDto updateReservationDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                // Validate dates
                if (updateReservationDto.CheckInDate >= updateReservationDto.CheckOutDate)
                {
                    return BadRequest(new { message = "Çıkış tarihi giriş tarihinden sonra olmalıdır" });
                }

                // Check room availability (excluding current reservation)
                var isRoomAvailable = await IsRoomAvailable(
                    updateReservationDto.RoomId,
                    updateReservationDto.CheckInDate,
                    updateReservationDto.CheckOutDate,
                    id);

                if (!isRoomAvailable)
                {
                    return BadRequest(new { message = "Seçilen tarihler için oda müsait değil" });
                }

                _mapper.Map(updateReservationDto, reservation);

                // Update status if provided
                if (updateReservationDto.Status.HasValue)
                {
                    var oldStatus = reservation.Status;
                    reservation.Status = updateReservationDto.Status.Value;

                    // Rezervasyon durumuna göre oda durumunu güncelle
                    var room = await _context.Rooms.FindAsync(reservation.RoomId);
                    if (room != null)
                    {
                        switch (updateReservationDto.Status.Value)
                        {
                            case ReservationStatus.CheckedIn:
                                room.Status = RoomStatus.Occupied;
                                if (reservation.ActualCheckInDate == null)
                                {
                                    reservation.ActualCheckInDate = DateTime.UtcNow;
                                }
                                break;

                            case ReservationStatus.CheckedOut:
                                room.Status = RoomStatus.Cleaning;
                                if (reservation.ActualCheckOutDate == null)
                                {
                                    reservation.ActualCheckOutDate = DateTime.UtcNow;
                                }
                                break;

                            case ReservationStatus.Cancelled:
                            case ReservationStatus.NoShow:
                                room.Status = RoomStatus.Available;
                                break;
                        }
                        room.UpdatedAt = DateTime.UtcNow;
                    }
                }

                reservation.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Get updated reservation with includes
                var updatedReservation = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == id);

                var reservationDto = new ReservationDto
                {
                    Id = updatedReservation!.Id,
                    CustomerId = updatedReservation.CustomerId,
                    CustomerName = updatedReservation.Customer.FirstName + " " + updatedReservation.Customer.LastName,
                    RoomId = updatedReservation.RoomId,
                    RoomNumber = updatedReservation.Room.RoomNumber,
                    CheckInDate = updatedReservation.CheckInDate,
                    CheckOutDate = updatedReservation.CheckOutDate,
                    NumberOfGuests = updatedReservation.NumberOfGuests,
                    TotalAmount = updatedReservation.TotalAmount,
                    PaidAmount = updatedReservation.PaidAmount,
                    Status = updatedReservation.Status,
                    Notes = updatedReservation.Notes,
                    ActualCheckInDate = updatedReservation.ActualCheckInDate,
                    ActualCheckOutDate = updatedReservation.ActualCheckOutDate
                };

                return Ok(reservationDto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"UpdateReservation Error: {ex.Message}");
                Console.WriteLine($"StackTrace: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"InnerException: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Rezervasyon güncellenirken hata oluştu", error = ex.Message, details = ex.StackTrace });
            }
        }

        [HttpPatch("{id}/status")]
        [AllRoles]
        public async Task<IActionResult> UpdateReservationStatus(int id, [FromBody] UpdateStatusDto updateStatusDto)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                var oldStatus = reservation.Status;
                reservation.Status = updateStatusDto.Status;
                reservation.UpdatedAt = DateTime.UtcNow;

                // Rezervasyon durumuna göre oda durumunu güncelle
                switch (updateStatusDto.Status)
                {
                    case ReservationStatus.CheckedIn:
                        reservation.Room.Status = RoomStatus.Occupied;
                        if (reservation.ActualCheckInDate == null)
                        {
                            reservation.ActualCheckInDate = DateTime.UtcNow;
                        }
                        break;

                    case ReservationStatus.CheckedOut:
                        reservation.Room.Status = RoomStatus.Cleaning;
                        if (reservation.ActualCheckOutDate == null)
                        {
                            reservation.ActualCheckOutDate = DateTime.UtcNow;
                        }
                        break;

                    case ReservationStatus.Cancelled:
                    case ReservationStatus.NoShow:
                        // İptal veya gelmedi durumunda oda müsait olur
                        reservation.Room.Status = RoomStatus.Available;
                        break;

                    default:
                        // Pending, Confirmed durumlarında oda durumu değişmez
                        break;
                }

                reservation.Room.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Rezervasyon durumu güncellendi" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "UpdateReservationStatus Error");
                return StatusCode(500, new { message = "Rezervasyon durumu güncellenirken bir hata oluştu" });
            }
        }

        [HttpDelete("{id}")]
        [ManagerOrAbove]
        public async Task<IActionResult> DeleteReservation(int id)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                // If reservation is checked in, update room status to available
                if (reservation.Status == ReservationStatus.CheckedIn)
                {
                    reservation.Room.Status = RoomStatus.Available;
                    reservation.Room.UpdatedAt = DateTime.UtcNow;
                }

                _context.Reservations.Remove(reservation);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Rezervasyon başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Rezervasyon silinirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("{id}/checkin")]
        [AllRoles]
        public async Task<IActionResult> CheckIn(int id, [FromBody] CheckInDto checkInDto)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                if (reservation.Status != ReservationStatus.Confirmed && reservation.Status != ReservationStatus.Pending)
                {
                    return BadRequest(new { message = "Sadece beklemede veya onaylanmış rezervasyonlar için check-in yapılabilir" });
                }

                // If reservation was pending, it's now automatically confirmed and checked in
                reservation.Status = ReservationStatus.CheckedIn;
                reservation.ActualCheckInDate = checkInDto.ActualCheckInDate;
                reservation.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrEmpty(checkInDto.Notes))
                {
                    reservation.Notes = string.IsNullOrEmpty(reservation.Notes)
                        ? checkInDto.Notes
                        : reservation.Notes + "\n" + checkInDto.Notes;
                }

                // Check-in yapıldığında oda dolu durumuna geçer
                reservation.Room.Status = RoomStatus.Occupied;
                reservation.Room.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Check-in işlemi başarıyla tamamlandı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Check-in işlemi sırasında hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("{id}/checkout")]
        [AllRoles]
        public async Task<IActionResult> CheckOut(int id, [FromBody] CheckOutDto checkOutDto)
        {
            try
            {
                var reservation = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                if (reservation.Status != ReservationStatus.CheckedIn)
                {
                    return BadRequest(new { message = "Sadece check-in yapılmış rezervasyonlar için check-out yapılabilir" });
                }

                reservation.Status = ReservationStatus.CheckedOut;
                reservation.ActualCheckOutDate = checkOutDto.ActualCheckOutDate;
                reservation.UpdatedAt = DateTime.UtcNow;

                if (!string.IsNullOrEmpty(checkOutDto.Notes))
                {
                    reservation.Notes = string.IsNullOrEmpty(reservation.Notes)
                        ? checkOutDto.Notes
                        : reservation.Notes + "\n" + checkOutDto.Notes;
                }

                // Check-out sonrası oda temizlik durumuna geçer (bu mantıklı)
                reservation.Room.Status = RoomStatus.Cleaning;
                reservation.Room.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Check-out işlemi başarıyla tamamlandı" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Check-out işlemi sırasında hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("dashboard-stats")]
        [AllRoles]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var today = DateTime.Today;
                var tomorrow = today.AddDays(1);

                Console.WriteLine($"Dashboard stats for date: {today:yyyy-MM-dd}");

                // Bugünkü gerçek check-in'ler (ActualCheckInDate bugün olan)
                var todayCheckIns = await _context.Reservations
                    .Where(r => r.ActualCheckInDate.HasValue &&
                               r.ActualCheckInDate.Value.Date == today)
                    .CountAsync();

                // Bugünkü gerçek check-out'lar (ActualCheckOutDate bugün olan)
                var todayCheckOuts = await _context.Reservations
                    .Where(r => r.ActualCheckOutDate.HasValue &&
                               r.ActualCheckOutDate.Value.Date == today)
                    .CountAsync();

                // Şu anda dolu olan odalar (CheckedIn durumunda olan rezervasyonlar)
                var occupiedRooms = await _context.Reservations
                    .Where(r => r.Status == ReservationStatus.CheckedIn)
                    .Select(r => r.RoomId)
                    .Distinct()
                    .CountAsync();

                // Toplam oda sayısı
                var totalRooms = await _context.Rooms.CountAsync();

                // Toplam müşteri sayısı
                var totalCustomers = await _context.Customers.CountAsync();

                // Toplam aktif rezervasyon sayısı
                var totalActiveReservations = await _context.Reservations
                    .Where(r => r.Status != ReservationStatus.Cancelled &&
                               r.Status != ReservationStatus.NoShow)
                    .CountAsync();

                Console.WriteLine($"Dashboard stats calculated:");
                Console.WriteLine($"- Today check-ins: {todayCheckIns}");
                Console.WriteLine($"- Today check-outs: {todayCheckOuts}");
                Console.WriteLine($"- Occupied rooms: {occupiedRooms}");
                Console.WriteLine($"- Total rooms: {totalRooms}");

                return Ok(new
                {
                    todayCheckIns,
                    todayCheckOuts,
                    occupiedRooms,
                    totalRooms,
                    totalCustomers,
                    totalActiveReservations,
                    date = today.ToString("yyyy-MM-dd")
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetDashboardStats Error");
                return StatusCode(500, new { message = "Dashboard istatistikleri alınırken hata oluştu" });
            }
        }

        [HttpGet("calendar")]
        public async Task<IActionResult> GetReservationCalendar([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var start = startDate ?? DateTime.Today;
                var end = endDate ?? DateTime.Today.AddDays(30);

                var reservations = await _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
                    .Where(r => r.CheckInDate <= end && r.CheckOutDate >= start &&
                               r.Status != ReservationStatus.Cancelled &&
                               r.Status != ReservationStatus.NoShow)
                    .Select(r => new
                    {
                        r.Id,
                        CustomerName = r.Customer.FirstName + " " + r.Customer.LastName,
                        RoomNumber = r.Room.RoomNumber,
                        r.CheckInDate,
                        r.CheckOutDate,
                        r.Status,
                        StatusName = r.Status == ReservationStatus.Pending ? "Beklemede" :
                                   r.Status == ReservationStatus.Confirmed ? "Onaylandı" :
                                   r.Status == ReservationStatus.CheckedIn ? "Giriş Yapıldı" :
                                   r.Status == ReservationStatus.CheckedOut ? "Çıkış Yapıldı" : "Diğer",
                        r.TotalAmount,
                        NumberOfNights = (r.CheckOutDate - r.CheckInDate).Days
                    })
                    .ToListAsync();

                return Ok(reservations);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Takvim verileri getirilirken hata oluştu", error = ex.Message });
            }
        }

        private async Task<bool> IsRoomAvailable(int roomId, DateTime checkInDate, DateTime checkOutDate, int? excludeReservationId = null)
        {
            var query = _context.Reservations
                .Where(r => r.RoomId == roomId &&
                           r.Status != ReservationStatus.Cancelled &&
                           r.Status != ReservationStatus.NoShow &&
                           ((r.CheckInDate < checkOutDate && r.CheckOutDate > checkInDate)));

            if (excludeReservationId.HasValue)
            {
                query = query.Where(r => r.Id != excludeReservationId.Value);
            }

            return !await query.AnyAsync();
        }
    }
}
