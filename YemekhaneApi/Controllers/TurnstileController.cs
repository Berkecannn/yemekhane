using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using YemekhaneApi.Data; // Kendi yapına göre Models yapabilirsin
using System.Threading.Tasks;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TurnstileController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TurnstileController(AppDbContext context)
        {
            _context = context;
        }

        public class QrRequest { public string QrData { get; set; } = string.Empty; }

        [HttpPost("gecis-yap")]
        public async Task<IActionResult> ValidatePass([FromBody] QrRequest request)
        {
            if (string.IsNullOrEmpty(request.QrData))
                return BadRequest(new { mesaj = "QR veri okunamadı." });

            // Veritabanında bu bilet kodunu ara
            var ticket = await _context.QrTickets.FirstOrDefaultAsync(t => t.TicketCode == request.QrData);

            // 1. Güvenlik Duvarı: Böyle bir bilet var mı?
            if (ticket == null)
                return BadRequest(new { mesaj = "Geçersiz veya sahte QR kod okutuldu!" });

            // 2. Güvenlik Duvarı: Bu bilet daha önce kullanıldı mı? (Ekran görüntüsü engelleyici kısım!)
            if (ticket.IsUsed)
                return BadRequest(new { mesaj = "Reddedildi! Bu QR kod daha önce turnikede kullanılmış." });

            // 3. Geçiş Onayı: Her şey doğruysa bileti anında iptal et (Kullanıldı yap)
            ticket.IsUsed = true;
            await _context.SaveChangesAsync();

            return Ok(new { mesaj = $"Geçiş Onaylandı. Turnike Açılıyor... Hoş geldin {ticket.StudentNumber}!" });
        }
    }
}