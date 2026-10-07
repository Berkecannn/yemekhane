using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using YemekhaneApi.Data; 
using YemekhaneApi.Models;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuthController(AppDbContext context)
        {
            _context = context;
        }

        public class RegisterDto
        {
            public string FirstName { get; set; } = string.Empty;
            public string LastName { get; set; } = string.Empty;
            public string StudentNumber { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            public string UniversityName { get; set; } = string.Empty;
        }

        public class LoginDto
        {
            public string StudentNumber { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
            // YENİ: Giriş yaparken üniversite adını da alıyoruz
            public string UniversityName { get; set; } = string.Empty; 
        }

        // ---------------------------------------------------
        // 1. KAYIT OLMA İŞLEMİ (REGISTER)
        // ---------------------------------------------------
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // KURAL 1: Boş alan bırakılamaz (Üniversite adı da kontrol ediliyor)
            if (string.IsNullOrWhiteSpace(request.FirstName) || 
                string.IsNullOrWhiteSpace(request.LastName) || 
                string.IsNullOrWhiteSpace(request.StudentNumber) || 
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.UniversityName))
            {
                return BadRequest(new { mesaj = "Lütfen tüm alanları eksiksiz doldurun." });
            }

            // KURAL 2: Şifre Güçlülük Kontrolü
            var passwordRegex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$");
            if (!passwordRegex.IsMatch(request.Password))
            {
                return BadRequest(new { mesaj = "Şifre en az 6 karakter olmalı; büyük harf, küçük harf ve özel karakter (.,!* gibi) içermelidir." });
            }

            // Temizlik İşlemi (Boşlukları yok et)
            string cleanStudentNumber = request.StudentNumber.Trim();
            string cleanUniversityName = request.UniversityName.Trim();

            // KURAL 3: Öğrenci numarası sadece rakamlardan oluşmalı
            if (!cleanStudentNumber.All(char.IsDigit))
            {
                return BadRequest(new { mesaj = "Öğrenci numarası sadece rakamlardan oluşmalıdır." });
            }

            // KURAL 4: Mükerrer Kayıt Kontrolü (Sadece Numara değil, Numara + Üniversite eşleşmesine bakıyoruz)
            if (await _context.Students.AnyAsync(s => s.StudentNumber == cleanStudentNumber && s.UniversityName == cleanUniversityName))
            {
                return BadRequest(new { mesaj = "Bu öğrenci numarası bu üniversitede zaten kayıtlı!" });
            }

            // Şifreyi Kriptolama (BCrypt)
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var newStudent = new Student
            {
                // İsimlerin de sağındaki solundaki boşlukları siliyoruz
                FirstName = request.FirstName.Trim(),
                LastName = request.LastName.Trim(),
                StudentNumber = cleanStudentNumber,
                UniversityName = cleanUniversityName,
                PasswordHash = passwordHash,
                Balance = 0 // Yeni kayıt bakiyesi sıfırdır
            };

            _context.Students.Add(newStudent);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Kayıt başarıyla oluşturuldu!" });
        }

        // ---------------------------------------------------
        // 2. GİRİŞ YAPMA İŞLEMİ (LOGIN & JWT)
        // ---------------------------------------------------
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            if (string.IsNullOrWhiteSpace(request.UniversityName))
            {
                return BadRequest(new { mesaj = "Lütfen giriş yapmak için üniversitenizi seçin." });
            }

            // Gelen verilerdeki boşlukları temizle
            string cleanStudentNumber = request.StudentNumber.Trim();
            string cleanUniversityName = request.UniversityName.Trim();

            // 1. Öğrenciyi veritabanında bul (Hem numara hem üniversite eşleşmek ZORUNDA)
            var student = await _context.Students.FirstOrDefaultAsync(s => 
                s.StudentNumber == cleanStudentNumber && 
                s.UniversityName == cleanUniversityName);
            
            if (student == null)
            {
                return BadRequest(new { mesaj = "Öğrenci numarası veya üniversite hatalı." });
            }

            // 2. Şifre doğrulama (BCrypt)
            if (!BCrypt.Net.BCrypt.Verify(request.Password, student.PasswordHash))
            {
                return BadRequest(new { mesaj = "Hatalı şifre girdiniz." });
            }

            // 3. JWT ÜRETİM KISMI (Token)
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, student.StudentNumber),
                new Claim(ClaimTypes.Name, student.FirstName),
                new Claim(ClaimTypes.Surname, student.LastName),
                // İleride lazım olur diye token'ın içine okulu da gömüyoruz
                new Claim("University", student.UniversityName) 
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("YemekhaneProjesiIcinCokGizliBirAnahtar123!"));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: "YemekhaneApi",
                audience: "YemekhaneMobil",
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            // 4. Token'ı istemciye (Mobil Uygulamaya) gönderiyoruz
            return Ok(new { 
                mesaj = "Giriş başarılı! Hoş geldin " + student.FirstName,
                token = tokenString 
            });
        }
    }
}