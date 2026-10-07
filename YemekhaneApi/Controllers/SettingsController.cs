using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using YemekhaneApi.Data;
using YemekhaneApi.Models;

namespace YemekhaneApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        public SettingsController(AppDbContext context) { _context = context; }

        public class PriceUpdateDto
        {
            public double Price { get; set; }
            public string UniversityName { get; set; } = string.Empty;
        }

        // GET: api/settings/yemek-fiyati?university=X Üniversitesi
        [HttpGet("yemek-fiyati")]
        public async Task<IActionResult> GetMealPrice([FromQuery] string university)
        {
            if (string.IsNullOrEmpty(university)) return Ok(new { fiyat = 50.0 }); // Varsayılan

            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "MealPrice" && s.UniversityName == university);
            
            double fiyat = setting != null ? double.Parse(setting.Value) : 50.0;
            return Ok(new { fiyat = fiyat });
        }

        [HttpPost("fiyat-guncelle")]
        public async Task<IActionResult> UpdateMealPrice([FromBody] PriceUpdateDto request)
        {
            var setting = await _context.SystemSettings
                .FirstOrDefaultAsync(s => s.Key == "MealPrice" && s.UniversityName == request.UniversityName);
            
            if (setting == null)
            {
                _context.SystemSettings.Add(new SystemSetting { 
                    Key = "MealPrice", 
                    Value = request.Price.ToString(),
                    UniversityName = request.UniversityName
                });
            }
            else
            {
                setting.Value = request.Price.ToString();
            }
            
            await _context.SaveChangesAsync();
            return Ok(new { mesaj = $"Fiyat, {request.UniversityName} için {request.Price} TL olarak güncellendi." });
        }
    }
}