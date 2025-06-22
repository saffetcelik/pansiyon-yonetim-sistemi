using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using PansiyonYonetimSistemi.API.Models;
using System.Security.Claims;

namespace PansiyonYonetimSistemi.API.Attributes
{
    /// <summary>
    /// Rol tabanlı yetkilendirme için özel attribute
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class RoleAuthorizationAttribute : Attribute, IAuthorizationFilter
    {
        private readonly UserRole[] _allowedRoles;

        public RoleAuthorizationAttribute(params UserRole[] allowedRoles)
        {
            _allowedRoles = allowedRoles ?? throw new ArgumentNullException(nameof(allowedRoles));
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            // Kullanıcının kimlik doğrulaması yapılmış mı kontrol et
            if (!context.HttpContext.User.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new { message = "Kimlik doğrulaması gerekli" });
                return;
            }

            // Kullanıcının rolünü al
            var userRoleClaim = context.HttpContext.User.FindFirst(ClaimTypes.Role);
            if (userRoleClaim == null)
            {
                context.Result = new ForbidResult();
                return;
            }

            // Rol string'ini enum'a çevir
            if (!Enum.TryParse<UserRole>(userRoleClaim.Value, out var userRole))
            {
                context.Result = new ForbidResult();
                return;
            }

            // Kullanıcının rolü izin verilen roller arasında mı kontrol et
            if (!_allowedRoles.Contains(userRole))
            {
                context.Result = new ObjectResult(new {
                    message = "Bu işlem için yetkiniz bulunmuyor",
                    requiredRoles = _allowedRoles.Select(r => r.ToString()).ToArray(),
                    userRole = userRole.ToString()
                })
                {
                    StatusCode = 403
                };
                return;
            }
        }
    }

    /// <summary>
    /// Sadece Admin rolü için yetkilendirme
    /// </summary>
    public class AdminOnlyAttribute : RoleAuthorizationAttribute
    {
        public AdminOnlyAttribute() : base(UserRole.Admin) { }
    }

    /// <summary>
    /// Admin ve Manager rolleri için yetkilendirme
    /// </summary>
    public class ManagerOrAboveAttribute : RoleAuthorizationAttribute
    {
        public ManagerOrAboveAttribute() : base(UserRole.Admin, UserRole.Manager) { }
    }

    /// <summary>
    /// Tüm roller için yetkilendirme (Admin, Manager, Staff)
    /// </summary>
    public class AllRolesAttribute : RoleAuthorizationAttribute
    {
        public AllRolesAttribute() : base(UserRole.Admin, UserRole.Manager, UserRole.Staff) { }
    }

    /// <summary>
    /// Sadece Staff rolü için yetkilendirme
    /// </summary>
    public class StaffOnlyAttribute : RoleAuthorizationAttribute
    {
        public StaffOnlyAttribute() : base(UserRole.Staff) { }
    }
}
