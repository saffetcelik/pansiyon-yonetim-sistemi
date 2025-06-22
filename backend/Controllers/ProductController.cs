using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PansiyonYonetimSistemi.API.Models;
using PansiyonYonetimSistemi.API.Services;
using PansiyonYonetimSistemi.API.DTOs;
using PansiyonYonetimSistemi.API.Attributes;

namespace PansiyonYonetimSistemi.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProductController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IStockService _stockService;

        public ProductController(IProductService productService, IStockService stockService)
        {
            _productService = productService;
            _stockService = stockService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetProducts()
        {
            try
            {
                var products = await _productService.GetAllProductsAsync();
                var productDtos = products.Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Category = p.Category,
                    Price = p.Price,
                    StockQuantity = p.StockQuantity,
                    MinStockLevel = p.MinStockLevel,
                    Unit = p.Unit,
                    Barcode = p.Barcode,
                    IsActive = p.IsActive
                });

                return Ok(productDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürünler getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProductDto>> GetProduct(int id)
        {
            try
            {
                var product = await _productService.GetProductByIdAsync(id);
                if (product == null)
                {
                    return NotFound(new { message = "Ürün bulunamadı" });
                }

                var productDto = new ProductDto
                {
                    Id = product.Id,
                    Name = product.Name,
                    Description = product.Description,
                    Category = product.Category,
                    Price = product.Price,

                    StockQuantity = product.StockQuantity,
                    MinStockLevel = product.MinStockLevel,
                    Unit = product.Unit,
                    Barcode = product.Barcode,
                    IsActive = product.IsActive
                };

                return Ok(productDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürün getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost]
        [ManagerOrAbove]
        public async Task<ActionResult<ProductDto>> CreateProduct(CreateProductDto createProductDto)
        {
            try
            {
                var product = new Product
                {
                    Name = createProductDto.Name,
                    Description = createProductDto.Description,
                    Category = createProductDto.Category,
                    Price = createProductDto.Price,
                    StockQuantity = createProductDto.StockQuantity,
                    MinStockLevel = createProductDto.MinStockLevel,
                    Unit = createProductDto.Unit,
                    Barcode = createProductDto.Barcode,
                    IsActive = createProductDto.IsActive
                };

                var createdProduct = await _productService.CreateProductAsync(product);

                var productDto = new ProductDto
                {
                    Id = createdProduct.Id,
                    Name = createdProduct.Name,
                    Description = createdProduct.Description,
                    Category = createdProduct.Category,
                    Price = createdProduct.Price,

                    StockQuantity = createdProduct.StockQuantity,
                    MinStockLevel = createdProduct.MinStockLevel,
                    Unit = createdProduct.Unit,
                    Barcode = createdProduct.Barcode,
                    IsActive = createdProduct.IsActive
                };

                return CreatedAtAction(nameof(GetProduct), new { id = createdProduct.Id }, productDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürün oluşturulurken hata oluştu", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [ManagerOrAbove]
        public async Task<ActionResult<ProductDto>> UpdateProduct(int id, UpdateProductDto updateProductDto)
        {
            try
            {
                var product = new Product
                {
                    Name = updateProductDto.Name,
                    Description = updateProductDto.Description,
                    Category = updateProductDto.Category,
                    Price = updateProductDto.Price,
                    MinStockLevel = updateProductDto.MinStockLevel,
                    Unit = updateProductDto.Unit,
                    Barcode = updateProductDto.Barcode
                };

                var updatedProduct = await _productService.UpdateProductAsync(id, product);
                if (updatedProduct == null)
                {
                    return NotFound(new { message = "Ürün bulunamadı" });
                }

                var productDto = new ProductDto
                {
                    Id = updatedProduct.Id,
                    Name = updatedProduct.Name,
                    Description = updatedProduct.Description,
                    Category = updatedProduct.Category,
                    Price = updatedProduct.Price,

                    StockQuantity = updatedProduct.StockQuantity,
                    MinStockLevel = updatedProduct.MinStockLevel,
                    Unit = updatedProduct.Unit,
                    Barcode = updatedProduct.Barcode,
                    IsActive = updatedProduct.IsActive
                };

                return Ok(productDto);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürün güncellenirken hata oluştu", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [AdminOnly]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            try
            {
                var result = await _productService.DeleteProductAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Ürün bulunamadı" });
                }

                return Ok(new { message = "Ürün başarıyla silindi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürün silinirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> SearchProducts([FromQuery] string query)
        {
            try
            {
                var products = await _productService.SearchProductsAsync(query);
                var productDtos = products.Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Category = p.Category,
                    Price = p.Price,

                    StockQuantity = p.StockQuantity,
                    MinStockLevel = p.MinStockLevel,
                    Unit = p.Unit,
                    Barcode = p.Barcode,
                    IsActive = p.IsActive
                });

                return Ok(productDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ürün arama sırasında hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<IEnumerable<ProductDto>>> GetLowStockProducts()
        {
            try
            {
                var products = await _productService.GetLowStockProductsAsync();
                var productDtos = products.Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Category = p.Category,
                    Price = p.Price,

                    StockQuantity = p.StockQuantity,
                    MinStockLevel = p.MinStockLevel,
                    Unit = p.Unit,
                    Barcode = p.Barcode,
                    IsActive = p.IsActive
                });

                return Ok(productDtos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Düşük stoklu ürünler getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpGet("stock-alerts")]
        public async Task<ActionResult<object>> GetStockAlerts()
        {
            try
            {
                var lowStockProducts = await _productService.GetLowStockProductsAsync();
                var totalStockValue = await _stockService.GetTotalStockValueAsync();
                var stockByCategory = await _stockService.GetStockByCategory();

                var alerts = new
                {
                    LowStockCount = lowStockProducts.Count(),
                    CriticalStockProducts = lowStockProducts.Where(p => p.StockQuantity == 0).Count(),
                    TotalStockValue = totalStockValue,
                    StockByCategory = stockByCategory,
                    LowStockProducts = lowStockProducts.Select(p => new
                    {
                        p.Id,
                        p.Name,
                        p.StockQuantity,
                        p.MinStockLevel,
                        p.Category,
                        AlertLevel = p.StockQuantity == 0 ? "Critical" : "Low"
                    })
                };

                return Ok(alerts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Stok uyarıları getirilirken hata oluştu", error = ex.Message });
            }
        }

        [HttpPost("{id}/stock")]
        [ManagerOrAbove]
        public async Task<IActionResult> UpdateStock(int id, UpdateStockDto updateStockDto)
        {
            try
            {
                if (!Enum.TryParse<TransactionType>(updateStockDto.Type, out var transactionType))
                {
                    return BadRequest(new { message = "Geçersiz işlem tipi" });
                }

                var result = await _productService.UpdateStockAsync(
                    id, 
                    updateStockDto.Quantity, 
                    transactionType, 
                    updateStockDto.Notes
                );

                if (!result)
                {
                    return NotFound(new { message = "Ürün bulunamadı" });
                }

                return Ok(new { message = "Stok başarıyla güncellendi" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Stok güncellenirken hata oluştu", error = ex.Message });
            }
        }
    }
}
