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
    [Route("api/rooms")]
    [Authorize]
    public class RoomController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public RoomController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetRooms()
        {
            try
            {
                var rooms = await _context.Rooms
                    .OrderBy(r => r.RoomNumber)
                    .ToListAsync();

                var roomDtos = _mapper.Map<List<RoomDto>>(rooms);
                return Ok(roomDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Odalar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoom(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { message = "Oda bulunamadı" });
                }

                var roomDto = _mapper.Map<RoomDto>(room);
                return Ok(roomDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomDto createRoomDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                // Check if room number already exists
                var existingRoom = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.RoomNumber == createRoomDto.RoomNumber);

                if (existingRoom != null)
                {
                    return BadRequest(new { message = "Bu oda numarası zaten kullanılıyor" });
                }

                var room = _mapper.Map<Room>(createRoomDto);
                room.CreatedAt = DateTime.UtcNow;

                _context.Rooms.Add(room);
                await _context.SaveChangesAsync();

                var roomDto = _mapper.Map<RoomDto>(room);
                return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, roomDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Manager")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomDto updateRoomDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { message = "Oda bulunamadı" });
                }

                // Check if room number already exists (excluding current room)
                var existingRoom = await _context.Rooms
                    .FirstOrDefaultAsync(r => r.RoomNumber == updateRoomDto.RoomNumber && r.Id != id);

                if (existingRoom != null)
                {
                    return BadRequest(new { message = "Bu oda numarası zaten kullanılıyor" });
                }

                _mapper.Map(updateRoomDto, room);
                room.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var roomDto = _mapper.Map<RoomDto>(room);
                return Ok(roomDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda güncellenirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] UpdateRoomStatusDto statusDto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { message = "Oda bulunamadı" });
                }

                room.Status = statusDto.Status;
                room.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                var roomDto = _mapper.Map<RoomDto>(room);
                return Ok(roomDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda durumu güncellenirken hata oluştu", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            try
            {
                var room = await _context.Rooms.FindAsync(id);
                if (room == null)
                {
                    return NotFound(new { message = "Oda bulunamadı" });
                }

                // Check if room has any reservations
                var hasReservations = await _context.Reservations
                    .AnyAsync(r => r.RoomId == id);

                if (hasReservations)
                {
                    return BadRequest(new { message = "Bu odanın rezervasyonları bulunduğu için silinemez" });
                }

                _context.Rooms.Remove(room);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Oda başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda silinirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("available")]
        public async Task<IActionResult> GetAvailableRooms()
        {
            try
            {
                var availableRooms = await _context.Rooms
                    .Where(r => r.Status == RoomStatus.Available)
                    .OrderBy(r => r.RoomNumber)
                    .ToListAsync();

                var roomDtos = _mapper.Map<List<RoomDto>>(availableRooms);
                return Ok(roomDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müsait odalar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("status-summary")]
        public async Task<IActionResult> GetRoomStatusSummary()
        {
            try
            {
                var summary = await _context.Rooms
                    .GroupBy(r => r.Status)
                    .Select(g => new
                    {
                        Status = g.Key,
                        Count = g.Count()
                    })
                    .ToListAsync();

                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda durumu özeti getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("availability")]
        public async Task<IActionResult> GetRoomAvailability(
            [FromQuery] DateTime checkInDate,
            [FromQuery] DateTime checkOutDate,
            [FromQuery] int? excludeReservationId = null)
        {
            try
            {
                Console.WriteLine($"Room availability request: CheckIn={checkInDate}, CheckOut={checkOutDate}, ExcludeReservation={excludeReservationId}");

                if (checkInDate >= checkOutDate)
                {
                    return BadRequest(new { message = "Çıkış tarihi giriş tarihinden sonra olmalıdır" });
                }

                // Önce tüm rezervasyonları kontrol edelim
                var conflictingReservations = await _context.Reservations
                    .Where(res =>
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.NoShow &&
                        (excludeReservationId == null || res.Id != excludeReservationId) &&
                        res.CheckInDate < checkOutDate &&
                        res.CheckOutDate > checkInDate)
                    .Select(res => new { res.Id, res.RoomId, res.CheckInDate, res.CheckOutDate, res.Status })
                    .ToListAsync();

                Console.WriteLine($"Conflicting reservations: {string.Join(", ", conflictingReservations.Select(r => $"ID:{r.Id}, Room:{r.RoomId}, {r.CheckInDate:yyyy-MM-dd} to {r.CheckOutDate:yyyy-MM-dd}"))}");

                // Oda durumu sadece fiziksel durum için (temizlik, bakım, arızalı)
                // Rezervasyon durumu tarih bazlı kontrol edilmeli
                var availableRooms = await _context.Rooms
                    .Where(r => r.Status != RoomStatus.OutOfOrder && r.Status != RoomStatus.Maintenance) // Sadece arızalı ve bakımdaki odaları hariç tut
                    .Where(r => !_context.Reservations.Any(res =>
                        res.RoomId == r.Id &&
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.NoShow &&
                        (excludeReservationId == null || res.Id != excludeReservationId) && // Edit durumunda mevcut rezervasyonu hariç tut
                        res.CheckInDate < checkOutDate &&
                        res.CheckOutDate > checkInDate))
                    .OrderBy(r => r.RoomNumber)
                    .ToListAsync();

                Console.WriteLine($"Available rooms: {string.Join(", ", availableRooms.Select(r => $"Room {r.RoomNumber} (ID:{r.Id})"))}");

                var roomDtos = _mapper.Map<List<RoomDto>>(availableRooms);
                return Ok(roomDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Müsait odalar getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{roomId}/occupied-dates")]
        public async Task<IActionResult> GetRoomOccupiedDates(
            [FromRoute] int roomId,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] int? excludeReservationId = null)
        {
            try
            {
                // Varsayılan tarih aralığı: bugünden 1 yıl sonraya kadar
                var start = startDate ?? DateTime.Today;
                var end = endDate ?? DateTime.Today.AddYears(1);

                Console.WriteLine($"Getting occupied dates for room {roomId} from {start:yyyy-MM-dd} to {end:yyyy-MM-dd}, excluding reservation {excludeReservationId}");

                // Odanın var olup olmadığını kontrol et
                var room = await _context.Rooms.FindAsync(roomId);
                if (room == null)
                {
                    return NotFound(new { message = "Oda bulunamadı" });
                }

                // Bu oda için dolu tarihleri al
                var occupiedPeriods = await _context.Reservations
                    .Where(res =>
                        res.RoomId == roomId &&
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.NoShow &&
                        (excludeReservationId == null || res.Id != excludeReservationId) &&
                        res.CheckInDate < end &&
                        res.CheckOutDate > start)
                    .Select(res => new
                    {
                        CheckInDate = res.CheckInDate,
                        CheckOutDate = res.CheckOutDate,
                        ReservationId = res.Id,
                        Status = res.Status
                    })
                    .OrderBy(res => res.CheckInDate)
                    .ToListAsync();

                Console.WriteLine($"Found {occupiedPeriods.Count} occupied periods for room {roomId}");

                return Ok(new
                {
                    roomId = roomId,
                    roomNumber = room.RoomNumber,
                    occupiedPeriods = occupiedPeriods
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Oda dolu tarihleri getirilirken hata oluştu", error = ex.Message });
            }
        }
    }
}
