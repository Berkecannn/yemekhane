using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using YemekhaneApi.Data;
using YemekhaneApi.Models;
using BCrypt.Net;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminAuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AdminAuthController(AppDbContext context) { _context = context; }

        public class AdminRegisterDto
        {
            public string UniversityName { get; set; } = string.Empty;
            public string FullName { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class AdminLoginDto
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] AdminRegisterDto request)
        {
            if (await _context.Admins.AnyAsync(a => a.Username == request.Username))
                return BadRequest(new { mesaj = "Bu kullanıcı adı zaten alınmış." });

            var admin = new Admin
            {
                UniversityName = request.UniversityName,
                FullName = request.FullName,
                Username = request.Username,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Admins.Add(admin);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Yönetici kaydı başarıyla oluşturuldu." });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] AdminLoginDto request)
        {
            var admin = await _context.Admins.FirstOrDefaultAsync(a => a.Username == request.Username);
            if (admin == null || !BCrypt.Net.BCrypt.Verify(request.Password, admin.PasswordHash))
                return Unauthorized(new { mesaj = "Kullanıcı adı veya şifre hatalı." });

            // Not: İleri seviye güvenlik için buraya JWT Token üretim kodu eklenebilir. 
            // Şimdilik frontend'in ihtiyacı olan temel bilgileri dönüyoruz.
            return Ok(new { 
                mesaj = "Giriş başarılı.", 
                token = "admin-secret-token-" + admin.Id, // Basit token simülasyonu
                universityName = admin.UniversityName,
                username = admin.Username
            });
        }
    }
}