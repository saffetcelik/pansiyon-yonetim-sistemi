using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public PaymentService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto createPaymentDto, int userId)
        {
            var payment = _mapper.Map<Payment>(createPaymentDto);
            payment.PaymentNumber = await GeneratePaymentNumberAsync();
            payment.UserId = userId;
            payment.Status = PaymentStatus.Completed; // Default to completed for manual entries

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return await GetPaymentByIdAsync(payment.Id);
        }

        public async Task<PaymentDto> GetPaymentByIdAsync(int id)
        {
            var payment = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (payment == null)
                throw new KeyNotFoundException($"Payment with ID {id} not found");

            return _mapper.Map<PaymentDto>(payment);
        }

        public async Task<List<PaymentDto>> GetAllPaymentsAsync()
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<List<PaymentDto>> SearchPaymentsAsync(PaymentSearchDto searchDto)
        {
            var query = _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .AsQueryable();

            if (searchDto.Type.HasValue)
                query = query.Where(p => p.Type == searchDto.Type.Value);

            if (searchDto.Status.HasValue)
                query = query.Where(p => p.Status == searchDto.Status.Value);

            if (searchDto.Method.HasValue)
                query = query.Where(p => p.Method == searchDto.Method.Value);

            if (searchDto.CustomerId.HasValue)
                query = query.Where(p => p.CustomerId == searchDto.CustomerId.Value);

            if (searchDto.ReservationId.HasValue)
                query = query.Where(p => p.ReservationId == searchDto.ReservationId.Value);

            if (searchDto.SaleId.HasValue)
                query = query.Where(p => p.SaleId == searchDto.SaleId.Value);

            if (searchDto.StartDate.HasValue)
                query = query.Where(p => p.PaymentDate >= searchDto.StartDate.Value);

            if (searchDto.EndDate.HasValue)
                query = query.Where(p => p.PaymentDate <= searchDto.EndDate.Value);

            if (searchDto.MinAmount.HasValue)
                query = query.Where(p => p.Amount >= searchDto.MinAmount.Value);

            if (searchDto.MaxAmount.HasValue)
                query = query.Where(p => p.Amount <= searchDto.MaxAmount.Value);

            var totalCount = await query.CountAsync();
            var payments = await query
                .OrderByDescending(p => p.PaymentDate)
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<PaymentDto> UpdatePaymentAsync(int id, UpdatePaymentDto updatePaymentDto)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                throw new KeyNotFoundException($"Payment with ID {id} not found");

            _mapper.Map(updatePaymentDto, payment);
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetPaymentByIdAsync(id);
        }

        public async Task<bool> DeletePaymentAsync(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return false;

            // Soft delete by setting status to cancelled
            payment.Status = PaymentStatus.Cancelled;
            payment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<PaymentSummaryDto> GetPaymentSummaryAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var payments = await _context.Payments
                .Where(p => p.PaymentDate >= startDate && p.PaymentDate < endDate && p.Status == PaymentStatus.Completed)
                .ToListAsync();

            return new PaymentSummaryDto
            {
                TotalAmount = payments.Sum(p => p.Amount),
                CashAmount = payments.Where(p => p.Method == PaymentMethod.Cash).Sum(p => p.Amount),
                CardAmount = payments.Where(p => p.Method == PaymentMethod.Card).Sum(p => p.Amount),
                TransferAmount = payments.Where(p => p.Method == PaymentMethod.Transfer).Sum(p => p.Amount),
                TotalCount = payments.Count,
                Date = date
            };
        }

        public async Task<List<PaymentDto>> GetPaymentsByCustomerAsync(int customerId)
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .Where(p => p.CustomerId == customerId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<List<PaymentDto>> GetPaymentsByReservationAsync(int reservationId)
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .Where(p => p.ReservationId == reservationId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<List<PaymentDto>> GetPaymentsBySaleAsync(int saleId)
        {
            var payments = await _context.Payments
                .Include(p => p.Customer)
                .Include(p => p.User)
                .Include(p => p.Reservation)
                .Include(p => p.Sale)
                .Where(p => p.SaleId == saleId)
                .OrderByDescending(p => p.PaymentDate)
                .ToListAsync();

            return _mapper.Map<List<PaymentDto>>(payments);
        }

        public async Task<string> GeneratePaymentNumberAsync()
        {
            var year = DateTime.Now.Year;
            var lastPayment = await _context.Payments
                .Where(p => p.PaymentNumber.StartsWith($"PAY-{year}-"))
                .OrderByDescending(p => p.PaymentNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastPayment != null)
            {
                var lastNumberStr = lastPayment.PaymentNumber.Split('-').Last();
                if (int.TryParse(lastNumberStr, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"PAY-{year}-{nextNumber:D4}";
        }

        public async Task<bool> ProcessRefundAsync(int paymentId, decimal refundAmount, string reason)
        {
            var originalPayment = await _context.Payments.FindAsync(paymentId);
            if (originalPayment == null || originalPayment.Status != PaymentStatus.Completed)
                return false;

            if (refundAmount > originalPayment.Amount)
                return false;

            // Create refund payment
            var refundPayment = new Payment
            {
                PaymentNumber = await GeneratePaymentNumberAsync(),
                Type = PaymentType.Refund,
                Status = PaymentStatus.Completed,
                Amount = -refundAmount, // Negative amount for refund
                Method = originalPayment.Method,
                PaymentDate = DateTime.UtcNow,
                Description = $"Refund for {originalPayment.PaymentNumber}: {reason}",
                CustomerId = originalPayment.CustomerId,
                ReservationId = originalPayment.ReservationId,
                SaleId = originalPayment.SaleId,
                UserId = originalPayment.UserId
            };

            _context.Payments.Add(refundPayment);

            // Update original payment status if fully refunded
            if (refundAmount == originalPayment.Amount)
            {
                originalPayment.Status = PaymentStatus.Refunded;
                originalPayment.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
