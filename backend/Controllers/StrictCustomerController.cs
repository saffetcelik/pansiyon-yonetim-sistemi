using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PansiyonYonetimSistemi.API.Data;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Models;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using System.Text.RegularExpressions;
using System.Collections.Generic;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/customers-strict")]
    [Authorize]
    public class StrictCustomerController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public StrictCustomerController(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetCustomers([FromQuery] CustomerSearchDto searchDto)
        {
            try
            {
                Console.WriteLine($"StrictCustomerController.GetCustomers called with searchDto: {System.Text.Json.JsonSerializer.Serialize(searchDto)}");
                
                // Müşteri sorgusu başlatılıyor
                var query = _context.Customers.AsQueryable();
                
                // AND mantığı ile bütün dolu alanları uygulama
                if (!string.IsNullOrEmpty(searchDto.FirstName))
                {
                    var firstNameParam = "%" + searchDto.FirstName.ToLower() + "%";
                    query = _context.Customers
                        .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"FirstName\")) LIKE unaccent({0})", firstNameParam);
                }

                if (!string.IsNullOrEmpty(searchDto.LastName))
                {
                    var lastNameParam = "%" + searchDto.LastName.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        // Önceki sorgunun sonuçlarını ID'lerle kısıtlayarak devam et
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"LastName\")) LIKE unaccent({0}) AND \"Id\" IN ({1})",
                                lastNameParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        // İlk sorgu sonuçları boşsa, ikinci sorguyu da uygula
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"LastName\")) LIKE unaccent({0})", lastNameParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.Name))
                {
                    var nameParam = "%" + searchDto.Name.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE (unaccent(LOWER(\"FirstName\")) LIKE unaccent({0}) OR unaccent(LOWER(\"LastName\")) LIKE unaccent({0})) AND \"Id\" IN ({1})",
                                nameParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"FirstName\")) LIKE unaccent({0}) OR unaccent(LOWER(\"LastName\")) LIKE unaccent({0})",
                                nameParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.TCKimlikNo))
                {
                    var tcParam = "%" + searchDto.TCKimlikNo + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE \"TCKimlikNo\" LIKE {0} AND \"Id\" IN ({1})",
                                tcParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE \"TCKimlikNo\" LIKE {0}", tcParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.PassportNo))
                {
                    var passportParam = "%" + searchDto.PassportNo.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"PassportNo\")) LIKE unaccent({0}) AND \"Id\" IN ({1})",
                                passportParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"PassportNo\")) LIKE unaccent({0})", passportParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.Phone))
                {
                    var phoneParam = "%" + searchDto.Phone + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE \"Phone\" LIKE {0} AND \"Id\" IN ({1})",
                                phoneParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE \"Phone\" LIKE {0}", phoneParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.Email))
                {
                    var emailParam = "%" + searchDto.Email.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"Email\")) LIKE unaccent({0}) AND \"Id\" IN ({1})",
                                emailParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"Email\")) LIKE unaccent({0})", emailParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.City))
                {
                    var cityParam = "%" + searchDto.City.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"City\")) LIKE unaccent({0}) AND \"Id\" IN ({1})",
                                cityParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"City\")) LIKE unaccent({0})", cityParam);
                    }
                }

                if (!string.IsNullOrEmpty(searchDto.Country))
                {
                    var countryParam = "%" + searchDto.Country.ToLower() + "%";
                    var tempIds = await query.Select(c => c.Id).ToListAsync();
                    
                    if (tempIds.Any())
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"Country\")) LIKE unaccent({0}) AND \"Id\" IN ({1})",
                                countryParam, string.Join(",", tempIds));
                    }
                    else
                    {
                        query = _context.Customers
                            .FromSqlRaw("SELECT * FROM \"Customers\" WHERE unaccent(LOWER(\"Country\")) LIKE unaccent({0})", countryParam);
                    }
                }

                // Sonuçları sırala ve getir
                var customers = await query
                    .OrderBy(c => c.FirstName)
                    .ThenBy(c => c.LastName)
                    .ToListAsync();

                Console.WriteLine($"Found {customers.Count} customers");

                var customerDtos = _mapper.Map<List<CustomerDto>>(customers);

                return Ok(new { data = customerDtos });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in StrictCustomerController.GetCustomers: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner exception: {ex.InnerException.Message}");
                }
                return StatusCode(500, new { message = "Müşteriler getirilirken hata oluştu", error = ex.Message });
            }
        }
    }
}
