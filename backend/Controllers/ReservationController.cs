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
                var query = _context.Reservations
                    .Include(r => r.Customer)
                    .Include(r => r.Room)
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
                        ActualCheckOutDate = r.ActualCheckOutDate
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
                    ActualCheckOutDate = reservation.ActualCheckOutDate
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

                // Check if room exists
                var roomExists = await _context.Rooms.AnyAsync(r => r.Id == createReservationDto.RoomId);
                if (!roomExists)
                {
                    return BadRequest(new { message = "Oda bulunamadı" });
                }

                var reservation = _mapper.Map<Reservation>(createReservationDto);
                reservation.CreatedAt = DateTime.UtcNow;
                reservation.Status = ReservationStatus.Pending;

                _context.Reservations.Add(reservation);
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
                    reservation.Status = updateReservationDto.Status.Value;
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
                var reservation = await _context.Reservations.FindAsync(id);
                if (reservation == null)
                {
                    return NotFound(new { message = "Rezervasyon bulunamadı" });
                }

                reservation.Status = updateStatusDto.Status;
                reservation.UpdatedAt = DateTime.UtcNow;

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

                // Oda durumunu değiştirme - rezervasyon durumu tarih bazlı kontrol edilir
                // Oda durumu sadece fiziksel durum için (temizlik, bakım, arızalı)
                // reservation.Room.Status = RoomStatus.Occupied; // Bu satırı kaldırıyoruz
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
