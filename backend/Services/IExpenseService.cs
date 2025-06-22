using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public interface IExpenseService
    {
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createExpenseDto, int userId);
        Task<ExpenseDto> GetExpenseByIdAsync(int id);
        Task<List<ExpenseDto>> GetAllExpensesAsync();
        Task<List<ExpenseDto>> SearchExpensesAsync(ExpenseSearchDto searchDto);
        Task<ExpenseDto> UpdateExpenseAsync(int id, UpdateExpenseDto updateExpenseDto);
        Task<bool> DeleteExpenseAsync(int id);
        Task<ExpenseDto> ApproveExpenseAsync(int id, ApproveExpenseDto approveExpenseDto, int approvedByUserId);
        Task<ExpenseDto> PayExpenseAsync(int id, PayExpenseDto payExpenseDto);
        Task<ExpenseSummaryDto> GetExpenseSummaryAsync(DateTime date);
        Task<List<ExpenseDto>> GetPendingExpensesAsync();
        Task<List<ExpenseDto>> GetOverdueExpensesAsync();
        Task<string> GenerateExpenseNumberAsync();
    }
}
