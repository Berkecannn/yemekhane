using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using YemekhaneApi.Data; // Eğer AppDbContext dosyan Models klasöründeyse burayı YemekhaneApi.Models yap!

var builder = WebApplication.CreateBuilder(args);

// Controller'ları servise ekliyoruz
builder.Services.AddControllers().AddJsonOptions(options =>
{
    // API'nin Türkçe dahil tüm dillerdeki karakterleri bozmadan tanımasını sağlar
    options.JsonSerializerOptions.Encoder = System.Text.Encodings.Web.JavaScriptEncoder.Create(System.Text.Unicode.UnicodeRanges.All);
});

// Veritabanı Bağlantısı (SQLite)
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection") ?? "Data Source=yemekhane.db"));

// 1. CORS AYARLARI (Tarayıcıların API'ye erişimine izin veriyoruz)
builder.Services.AddCors(options =>
{
    options.AddPolicy("TumuneIzinVer",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// 2. JWT KİMLİK DOĞRULAMA AYARLARI
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = "YemekhaneApi",
            ValidAudience = "YemekhaneMobil",
            // Güvenlik anahtarımız (Gerçek projelerde gizli tutulur)
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("YemekhaneProjesiIcinCokGizliBirAnahtar123!")) 
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// MİMARİ SIRALAMA ÇOK ÖNEMLİDİR: CORS -> Authentication -> Authorization
app.UseCors("TumuneIzinVer");

app.UseAuthentication(); 
app.UseAuthorization();

app.MapControllers();

app.Run();