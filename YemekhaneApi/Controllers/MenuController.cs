using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using YemekhaneApi.Data;
using YemekhaneApi.Models;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MenuController(AppDbContext context)
        {
            _context = context;
        }

        // 1. GÜNLÜK MENÜ GETİR (Üniversiteye Göre Filtreli)
        // Kullanım: GET api/menu/2026-06-01?university=X Üniversitesi
        [HttpGet("{date}")]
        public async Task<IActionResult> GetMenu(string date, [FromQuery] string university)
        {
            if (string.IsNullOrEmpty(university))
            {
                return BadRequest(new { mesaj = "Üniversite bilgisi eksik!" });
            }

            var menu = await _context.Menus
                .FirstOrDefaultAsync(m => m.Date == date && m.UniversityName == university);
            
            if (menu == null) 
            {
                return NotFound(new { mesaj = "Bu tarih için menü bulunamadı." });
            }
            
            return Ok(menu);
        }

        // 2. AYLIK MENÜ GETİR (Üniversiteye Göre Filtreli)
        // Kullanım: GET api/menu/aylik/2026/6?university=X Üniversitesi
        [HttpGet("aylik/{year}/{month}")]
        public async Task<IActionResult> GetMonthlyMenu(int year, int month, [FromQuery] string university)
        {
            if (string.IsNullOrEmpty(university))
            {
                return BadRequest(new { mesaj = "Üniversite bilgisi eksik!" });
            }

            // İlgili ayın başlangıç ve bitiş tarihlerini hesapla (Örn: 2026-06-01 ile 2026-06-31 arası)
            string startDate = $"{year}-{month:D2}-01";
            string endDate = $"{year}-{month:D2}-31";

            var menus = await _context.Menus
                .Where(m => string.Compare(m.Date, startDate) >= 0 && 
                            string.Compare(m.Date, endDate) <= 0 && 
                            m.UniversityName == university)
                .OrderBy(m => m.Date)
                .ToListAsync();

            return Ok(menus);
        }

       // 3. TOPTAN VEYA TEKLİ MENÜ EKLE (Upsert - Güncelle/Ekle Mantığı)
        // Kullanım: POST api/menu/toptan-ekle
        [HttpPost("toptan-ekle")]
        public async Task<IActionResult> AddBulkMenu([FromBody] List<Menu> menus)
        {
            if (menus == null || menus.Count == 0) 
            {
                return BadRequest(new { mesaj = "Eklenecek menü listesi boş!" });
            }

            int eklenen = 0;
            int guncellenen = 0;

            foreach (var menu in menus)
            {
                // O tarihte, o üniversiteye ait bir menü zaten var mı diye kontrol ediyoruz
                var existingMenu = await _context.Menus
                    .FirstOrDefaultAsync(m => m.Date == menu.Date && m.UniversityName == menu.UniversityName);

                if (existingMenu != null)
                {
                    // 1. DURUM: Menü Zaten Var -> Sadece İçeriğini Güncelle (Üzerine Yaz)
                    existingMenu.Soup = menu.Soup;
                    existingMenu.MainDish = menu.MainDish;
                    existingMenu.SideDish = menu.SideDish;
                    existingMenu.Dessert = menu.Dessert;
                    existingMenu.Drink = menu.Drink;
                    existingMenu.TotalCalories = menu.TotalCalories;
                    
                    guncellenen++;
                }
                else
                {
                    // 2. DURUM: O Gün İçin Menü Yok -> Yeni Kayıt Olarak Ekle
                    _context.Menus.Add(menu);
                    
                    eklenen++;
                }
            }
            
            // Tüm değişiklikleri (eklemeler ve güncellemeler) tek seferde veritabanına onayla
            await _context.SaveChangesAsync();
            
            return Ok(new { mesaj = $"İşlem Başarılı! {eklenen} yeni menü eklendi, {guncellenen} mevcut menü güncellendi." });
        }
    }
}