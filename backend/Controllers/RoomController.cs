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
        public async Task<IActionResult> GetRoomAvailability([FromQuery] DateTime checkInDate, [FromQuery] DateTime checkOutDate)
        {
            try
            {
                if (checkInDate >= checkOutDate)
                {
                    return BadRequest(new { message = "Çıkış tarihi giriş tarihinden sonra olmalıdır" });
                }

                var availableRooms = await _context.Rooms
                    .Where(r => r.Status == RoomStatus.Available)
                    .Where(r => !_context.Reservations.Any(res =>
                        res.RoomId == r.Id &&
                        res.Status != ReservationStatus.Cancelled &&
                        res.Status != ReservationStatus.NoShow &&
                        res.CheckInDate < checkOutDate &&
                        res.CheckOutDate > checkInDate))
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
    }
}
