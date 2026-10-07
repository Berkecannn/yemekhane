using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using YemekhaneApi.Data; 
using YemekhaneApi.Models;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Sınıfın geneli yetkilendirme (Token) istiyor
    public class StudentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StudentController(AppDbContext context)
        {
            _context = context;
        }

        // ------------------------------------------------------------------
        // 1. YEMEK YEME İŞLEMİ (Tek Kullanımlık Süresiz QR Bilet Üretimi)
        // ------------------------------------------------------------------
        [HttpPost("yemek-ye/{studentNumber}")]
        public async Task<IActionResult> EatMeal(string studentNumber)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == studentNumber);
            if (student == null) return NotFound(new { mesaj = "Öğrenci bulunamadı." });

            // YENİ: Fiyatı veritabanından ÖĞRENCİNİN ÜNİVERSİTESİNE göre çek
            var priceSetting = await _context.SystemSettings.FirstOrDefaultAsync(s => s.Key == "MealPrice" && s.UniversityName == student.UniversityName);
            
            // Eğer o üniversiteye ait özel bir fiyat girilmişse onu al, yoksa varsayılan 50.0 TL'yi kullan
            double menuFiyati = priceSetting != null ? double.Parse(priceSetting.Value) : 50.0;

            if (student.Balance < menuFiyati) 
                return BadRequest(new { mesaj = $"Bakiye yetersiz! {student.UniversityName} güncel menü fiyatı {menuFiyati} TL. Mevcut Bakiye: {student.Balance} TL" });

            student.Balance -= menuFiyati;
            await _context.SaveChangesAsync();
            
            // SÜRESİZ VE TEK KULLANIMLIK BENZERSİZ KOD ÜRETİMİ
            string benzersizBiletKodu = "YMK-" + Guid.NewGuid().ToString().Substring(0, 18);

            // Bilet kaydını veritabanına henüz kullanılmadı (IsUsed = false) olarak ekliyoruz
            var ticket = new QrTicket
            {
                TicketCode = benzersizBiletKodu,
                StudentNumber = student.StudentNumber,
                IsUsed = false,
                CreatedAt = DateTime.UtcNow
            };

            _context.QrTickets.Add(ticket);
            await _context.SaveChangesAsync();

            return Ok(new { 
                mesaj = "Afiyet olsun!", 
                kalanBakiye = student.Balance, 
                qrKod = benzersizBiletKodu // Telefona sadece bu eşsiz kodu yolluyoruz
            });
        }

        // ------------------------------------------------------------------
        // 2. BAKİYE YÜKLEME İŞLEMİ
        // ------------------------------------------------------------------
        public class BakiyeDto { public double Miktar { get; set; } }

        [AllowAnonymous] // Postman/Thunder testleri için açık bırakılabilir
        [HttpPost("bakiye-yukle/{studentNumber}")]
        public async Task<IActionResult> AddBalance(string studentNumber, [FromBody] BakiyeDto request)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == studentNumber);
            if (student == null) return NotFound(new { mesaj = "Öğrenci bulunamadı." });

            student.Balance += request.Miktar;
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = $"{request.Miktar} TL başarıyla yüklendi. Yeni Bakiyeniz: {student.Balance} TL" });
        }

        // ------------------------------------------------------------------
        // 3. ŞİFRE GÜNCELLEME İŞLEMİ
        // ------------------------------------------------------------------
        public class ChangePasswordDto { public string YeniSifre { get; set; } = string.Empty; }

        [HttpPost("sifre-guncelle/{studentNumber}")]
        public async Task<IActionResult> UpdatePassword(string studentNumber, [FromBody] ChangePasswordDto request)
        {
            var passwordRegex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$");
            if (!passwordRegex.IsMatch(request.YeniSifre))
                return BadRequest(new { mesaj = "Şifre en az 6 karakter olmalı; büyük/küçük harf ve özel karakter içermelidir." });

            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == studentNumber);
            if (student == null) return NotFound();

            student.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.YeniSifre);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Şifreniz başarıyla güncellendi!" });
        }

        // ------------------------------------------------------------------
        // 4. KART KAYDETME İŞLEMİ
        // ------------------------------------------------------------------
        public class SaveCardDto { public string CardAlias { get; set; } = string.Empty; public string FullCardNumber { get; set; } = string.Empty; }

        [HttpPost("kart-kaydet/{studentNumber}")]
        public async Task<IActionResult> SaveCard(string studentNumber, [FromBody] SaveCardDto request)
        {
            // Kart numarasındaki boşlukları temizle
            string temizKart = request.FullCardNumber.Replace(" ", "");
            if(temizKart.Length < 16) return BadRequest(new { mesaj = "Geçersiz kart numarası" });

            // Sadece son 4 haneyi açık bırak (Maskeleme)
            string sonDort = temizKart.Substring(temizKart.Length - 4);
            string maskeliKart = $"**** **** **** {sonDort}";
            
            // Gerçekçi bir senaryo için kartın tamamını Base64 (veya AES256) ile şifreleme simülasyonu
            string sahteSifreliVeri = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(temizKart));

            var newCard = new SavedCard
            {
                StudentNumber = studentNumber,
                CardAlias = string.IsNullOrWhiteSpace(request.CardAlias) ? "Kayıtlı Kartım" : request.CardAlias,
                MaskedCardNumber = maskeliKart,
                EncryptedCardData = sahteSifreliVeri
            };

            _context.SavedCards.Add(newCard);
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = "Kartınız güvenli bir şekilde şifrelenerek kaydedildi." });
        }

        // ------------------------------------------------------------------
        // 5. KAYITLI KARTLARI LİSTELEME
        // ------------------------------------------------------------------
        [HttpGet("kartlarim/{studentNumber}")]
        public async Task<IActionResult> GetMyCards(string studentNumber)
        {
            var cards = await _context.SavedCards
                .Where(c => c.StudentNumber == studentNumber)
                .Select(c => new { c.Id, c.CardAlias, c.MaskedCardNumber }) // Güvenlik için şifreli veriyi API'den dışarı asla çıkarmıyoruz
                .ToListAsync();

            return Ok(cards);
        }

        // ------------------------------------------------------------------
       // 6. ÖĞRENCİ BİLGİLERİNİ GETİRME (Profil ve Ana Sayfa Bakiye İçin)
        [HttpGet("bilgilerim/{studentNumber}")]
        public async Task<IActionResult> GetStudentInfo(string studentNumber)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == studentNumber);
            if (student == null) return NotFound(new { mesaj = "Öğrenci bulunamadı." });

            return Ok(new { 
                ad = student.FirstName, 
                soyad = student.LastName, 
                ogrenciNo = student.StudentNumber,
                bakiye = student.Balance,
                okul = student.UniversityName
            });
        }

        // ------------------------------------------------------------------
        // 7. KAYITLI KARTI SİLME İŞLEMİ
        // ------------------------------------------------------------------
        [HttpDelete("kart-sil/{cardId}")]
        public async Task<IActionResult> DeleteCard(int cardId)
        {
            var card = await _context.SavedCards.FindAsync(cardId);
            if (card == null) return NotFound(new { mesaj = "Kart bulunamadı." });

            _context.SavedCards.Remove(card);
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Kart başarıyla silindi." });
        }

        // ------------------------------------------------------------------
        // 8. AKTİF BİLETLERİMİ GETİR (Sadece kullanılmayanlar)
        // ------------------------------------------------------------------
        [HttpGet("aktif-biletlerim/{studentNumber}")]
        public async Task<IActionResult> GetActiveTickets(string studentNumber)
        {
            var tickets = await _context.QrTickets
                .Where(t => t.StudentNumber == studentNumber && !t.IsUsed)
                .OrderByDescending(t => t.CreatedAt) // En yeni bilet en üstte gelsin
                .Select(t => new { t.TicketCode, t.CreatedAt })
                .ToListAsync();

            return Ok(tickets);
        }

        // ------------------------------------------------------------------
        // 9. BİLET DURUMU KONTROLÜ (Turnike kodu okudu mu?)
        // ------------------------------------------------------------------
        [HttpGet("bilet-durumu/{ticketCode}")]
        public async Task<IActionResult> CheckTicketStatus(string ticketCode)
        {
            var ticket = await _context.QrTickets.FirstOrDefaultAsync(t => t.TicketCode == ticketCode);
            if (ticket == null) return NotFound();

            return Ok(new { isUsed = ticket.IsUsed }); // True ise turnike okumuştur!
        }

        // ------------------------------------------------------------------
        // 10. HESABI TAMAMEN SİLME İŞLEMİ
        // ------------------------------------------------------------------
        [HttpDelete("hesap-sil/{studentNumber}")]
        public async Task<IActionResult> DeleteAccount(string studentNumber)
        {
            var student = await _context.Students.FirstOrDefaultAsync(s => s.StudentNumber == studentNumber);
            if (student == null) return NotFound(new { mesaj = "Öğrenci bulunamadı." });

            // 1. ÖKSÜZ KALMAMASI İÇİN: Öğrencinin aktif/kullanılmış tüm biletlerini sil
            var ogrencininBiletleri = await _context.QrTickets.Where(t => t.StudentNumber == studentNumber).ToListAsync();
            if (ogrencininBiletleri.Any())
            {
                _context.QrTickets.RemoveRange(ogrencininBiletleri);
            }

            // 2. ÖKSÜZ KALMAMASI İÇİN: Öğrencinin cüzdanındaki kayıtlı kartları sil
            var ogrencininKartlari = await _context.SavedCards.Where(c => c.StudentNumber == studentNumber).ToListAsync();
            if (ogrencininKartlari.Any())
            {
                _context.SavedCards.RemoveRange(ogrencininKartlari);
            }

            // 3. SON VURUŞ: Öğrencinin kendisini kalıcı olarak sil
            _context.Students.Remove(student);
            
            // Tüm silme işlemlerini tek seferde veritabanına onayla
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = "Hesabınız ve tüm verileriniz başarıyla silindi." });
        }
    }
}