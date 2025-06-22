using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;

namespace PansiyonYonetimSistemi.API.Services
{
    public class ExpenseService : IExpenseService
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ExpenseService(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto createExpenseDto, int userId)
        {
            var expense = _mapper.Map<Expense>(createExpenseDto);
            expense.ExpenseNumber = await GenerateExpenseNumberAsync();
            expense.UserId = userId;
            expense.Status = ExpenseStatus.Pending;

            _context.Expenses.Add(expense);
            await _context.SaveChangesAsync();

            return await GetExpenseByIdAsync(expense.Id);
        }

        public async Task<ExpenseDto> GetExpenseByIdAsync(int id)
        {
            var expense = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.ApprovedByUser)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                throw new KeyNotFoundException($"Expense with ID {id} not found");

            return _mapper.Map<ExpenseDto>(expense);
        }

        public async Task<List<ExpenseDto>> GetAllExpensesAsync()
        {
            var expenses = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.ApprovedByUser)
                .OrderByDescending(e => e.ExpenseDate)
                .ToListAsync();

            return _mapper.Map<List<ExpenseDto>>(expenses);
        }

        public async Task<List<ExpenseDto>> SearchExpensesAsync(ExpenseSearchDto searchDto)
        {
            var query = _context.Expenses
                .Include(e => e.User)
                .Include(e => e.ApprovedByUser)
                .AsQueryable();

            if (searchDto.Category.HasValue)
                query = query.Where(e => e.Category == searchDto.Category.Value);

            if (searchDto.Status.HasValue)
                query = query.Where(e => e.Status == searchDto.Status.Value);

            if (!string.IsNullOrEmpty(searchDto.Vendor))
                query = query.Where(e => e.Vendor != null && e.Vendor.Contains(searchDto.Vendor));

            if (searchDto.StartDate.HasValue)
                query = query.Where(e => e.ExpenseDate >= searchDto.StartDate.Value);

            if (searchDto.EndDate.HasValue)
                query = query.Where(e => e.ExpenseDate <= searchDto.EndDate.Value);

            if (searchDto.MinAmount.HasValue)
                query = query.Where(e => e.Amount >= searchDto.MinAmount.Value);

            if (searchDto.MaxAmount.HasValue)
                query = query.Where(e => e.Amount <= searchDto.MaxAmount.Value);

            if (searchDto.IsOverdue.HasValue && searchDto.IsOverdue.Value)
                query = query.Where(e => e.DueDate.HasValue && e.DueDate < DateTime.Today && e.Status != ExpenseStatus.Paid);

            var totalCount = await query.CountAsync();
            var expenses = await query
                .OrderByDescending(e => e.ExpenseDate)
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .ToListAsync();

            return _mapper.Map<List<ExpenseDto>>(expenses);
        }

        public async Task<ExpenseDto> UpdateExpenseAsync(int id, UpdateExpenseDto updateExpenseDto)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                throw new KeyNotFoundException($"Expense with ID {id} not found");

            // Only allow updates if expense is pending or approved (not paid)
            if (expense.Status == ExpenseStatus.Paid)
                throw new InvalidOperationException("Cannot update paid expenses");

            _mapper.Map(updateExpenseDto, expense);
            expense.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return await GetExpenseByIdAsync(id);
        }

        public async Task<bool> DeleteExpenseAsync(int id)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                return false;

            // Only allow deletion if expense is pending
            if (expense.Status != ExpenseStatus.Pending)
                return false;

            expense.Status = ExpenseStatus.Cancelled;
            expense.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<ExpenseDto> ApproveExpenseAsync(int id, ApproveExpenseDto approveExpenseDto, int approvedByUserId)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                throw new KeyNotFoundException($"Expense with ID {id} not found");

            if (expense.Status != ExpenseStatus.Pending)
                throw new InvalidOperationException("Only pending expenses can be approved or rejected");

            expense.Status = approveExpenseDto.Approved ? ExpenseStatus.Approved : ExpenseStatus.Rejected;
            expense.ApprovedByUserId = approvedByUserId;
            expense.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(approveExpenseDto.Notes))
            {
                expense.Notes = string.IsNullOrEmpty(expense.Notes) 
                    ? approveExpenseDto.Notes 
                    : $"{expense.Notes}\n\nApproval Notes: {approveExpenseDto.Notes}";
            }

            await _context.SaveChangesAsync();
            return await GetExpenseByIdAsync(id);
        }

        public async Task<ExpenseDto> PayExpenseAsync(int id, PayExpenseDto payExpenseDto)
        {
            var expense = await _context.Expenses.FindAsync(id);
            if (expense == null)
                throw new KeyNotFoundException($"Expense with ID {id} not found");

            if (expense.Status != ExpenseStatus.Approved)
                throw new InvalidOperationException("Only approved expenses can be paid");

            expense.Status = ExpenseStatus.Paid;
            expense.PaymentMethod = payExpenseDto.PaymentMethod;
            expense.PaymentDate = payExpenseDto.PaymentDate;
            expense.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(payExpenseDto.Notes))
            {
                expense.Notes = string.IsNullOrEmpty(expense.Notes) 
                    ? payExpenseDto.Notes 
                    : $"{expense.Notes}\n\nPayment Notes: {payExpenseDto.Notes}";
            }

            await _context.SaveChangesAsync();
            return await GetExpenseByIdAsync(id);
        }

        public async Task<ExpenseSummaryDto> GetExpenseSummaryAsync(DateTime date)
        {
            var startDate = date.Date;
            var endDate = startDate.AddDays(1);

            var expenses = await _context.Expenses
                .Where(e => e.ExpenseDate >= startDate && e.ExpenseDate < endDate)
                .ToListAsync();

            var categoryBreakdown = expenses
                .GroupBy(e => e.Category)
                .ToDictionary(
                    g => GetExpenseCategoryName(g.Key),
                    g => g.Sum(e => e.Amount)
                );

            return new ExpenseSummaryDto
            {
                TotalAmount = expenses.Sum(e => e.Amount),
                PaidAmount = expenses.Where(e => e.Status == ExpenseStatus.Paid).Sum(e => e.Amount),
                PendingAmount = expenses.Where(e => e.Status == ExpenseStatus.Pending).Sum(e => e.Amount),
                OverdueAmount = expenses.Where(e => e.DueDate.HasValue && e.DueDate < DateTime.Today && e.Status != ExpenseStatus.Paid).Sum(e => e.Amount),
                TotalCount = expenses.Count,
                PaidCount = expenses.Count(e => e.Status == ExpenseStatus.Paid),
                PendingCount = expenses.Count(e => e.Status == ExpenseStatus.Pending),
                OverdueCount = expenses.Count(e => e.DueDate.HasValue && e.DueDate < DateTime.Today && e.Status != ExpenseStatus.Paid),
                Date = date,
                CategoryBreakdown = categoryBreakdown
            };
        }

        public async Task<List<ExpenseDto>> GetPendingExpensesAsync()
        {
            var expenses = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.ApprovedByUser)
                .Where(e => e.Status == ExpenseStatus.Pending)
                .OrderBy(e => e.ExpenseDate)
                .ToListAsync();

            return _mapper.Map<List<ExpenseDto>>(expenses);
        }

        public async Task<List<ExpenseDto>> GetOverdueExpensesAsync()
        {
            var expenses = await _context.Expenses
                .Include(e => e.User)
                .Include(e => e.ApprovedByUser)
                .Where(e => e.DueDate.HasValue && e.DueDate < DateTime.Today && e.Status != ExpenseStatus.Paid)
                .OrderBy(e => e.DueDate)
                .ToListAsync();

            return _mapper.Map<List<ExpenseDto>>(expenses);
        }

        public async Task<string> GenerateExpenseNumberAsync()
        {
            var year = DateTime.Now.Year;
            var lastExpense = await _context.Expenses
                .Where(e => e.ExpenseNumber.StartsWith($"EXP-{year}-"))
                .OrderByDescending(e => e.ExpenseNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastExpense != null)
            {
                var lastNumberStr = lastExpense.ExpenseNumber.Split('-').Last();
                if (int.TryParse(lastNumberStr, out int lastNumber))
                {
                    nextNumber = lastNumber + 1;
                }
            }

            return $"EXP-{year}-{nextNumber:D4}";
        }

        private static string GetExpenseCategoryName(ExpenseCategory category)
        {
            return category switch
            {
                ExpenseCategory.Utilities => "Faturalar",
                ExpenseCategory.Maintenance => "Bakım-Onarım",
                ExpenseCategory.Supplies => "Malzeme",
                ExpenseCategory.Staff => "Personel",
                ExpenseCategory.Marketing => "Pazarlama",
                ExpenseCategory.Insurance => "Sigorta",
                ExpenseCategory.Tax => "Vergi",
                ExpenseCategory.Rent => "Kira",
                ExpenseCategory.Food => "Yiyecek-İçecek",
                ExpenseCategory.Cleaning => "Temizlik",
                ExpenseCategory.Other => "Diğer",
                _ => "Bilinmeyen"
            };
        }
    }
}
