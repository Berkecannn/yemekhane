using System;

namespace YemekhaneApi.Models
{
    public class QrTicket
    {
        public int Id { get; set; }
        public string TicketCode { get; set; } = string.Empty; // Üretilecek benzersiz şifreli metin
        public string StudentNumber { get; set; } = string.Empty;
        public bool IsUsed { get; set; } = false; // Kullanıldı mı kontrolü
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // İleride raporlama yapmak gerekirse diye tarih
    }
}