using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IPaymentService
    {
        Task<PaymentDto> CreatePaymentAsync(CreatePaymentDto createPaymentDto, int userId);
        Task<PaymentDto> GetPaymentByIdAsync(int id);
        Task<List<PaymentDto>> GetAllPaymentsAsync();
        Task<List<PaymentDto>> SearchPaymentsAsync(PaymentSearchDto searchDto);
        Task<PaymentDto> UpdatePaymentAsync(int id, UpdatePaymentDto updatePaymentDto);
        Task<bool> DeletePaymentAsync(int id);
        Task<PaymentSummaryDto> GetPaymentSummaryAsync(DateTime date);
        Task<List<PaymentDto>> GetPaymentsByCustomerAsync(int customerId);
        Task<List<PaymentDto>> GetPaymentsByReservationAsync(int reservationId);
        Task<List<PaymentDto>> GetPaymentsBySaleAsync(int saleId);
        Task<string> GeneratePaymentNumberAsync();
        Task<bool> ProcessRefundAsync(int paymentId, decimal refundAmount, string reason);
    }
}
