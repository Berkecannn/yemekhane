using Microsoft.EntityFrameworkCore;
using YemekhaneApi.Models;

namespace YemekhaneApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Veritabanında oluşacak tablolarımız
        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Menu> Menus { get; set; }
        public DbSet<Student> Students { get; set; }
        public DbSet<SavedCard> SavedCards { get; set; }
        public DbSet<QrTicket> QrTickets { get; set; }
        public DbSet<SystemSetting> SystemSettings { get; set; }
    }
}