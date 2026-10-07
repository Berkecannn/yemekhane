namespace YemekhaneApi.Models
{
    public class SavedCard
    {
        public int Id { get; set; }
        public string StudentNumber { get; set; } = string.Empty;
        
        // Kullanıcının karta vereceği isim (Örn: "Ziraat Bankkartım")
        public string CardAlias { get; set; } = string.Empty; 
        
        // Ekranda görünecek maskeli hali (Örn: "**** **** **** 1234")
        public string MaskedCardNumber { get; set; } = string.Empty; 
        
        // Gerçek ödeme altyapılarında kullanılan, şifrelenmiş veri veya Token
        public string EncryptedCardData { get; set; } = string.Empty; 
    }
}