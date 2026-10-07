namespace YemekhaneApi.Models
{
    public class Menu
    {
        public string UniversityName { get; set; } = string.Empty;
        public int Id { get; set; }
        public string Date { get; set; } = string.Empty; 
        public string Soup { get; set; } = string.Empty; 
        public string MainDish { get; set; } = string.Empty; 
        
        // Yeni Eklenen Alanlar
        public string SideDish { get; set; } = string.Empty; // Yardımcı Yemek (Pilav, Makarna vb.)
        public string Dessert { get; set; } = string.Empty;  // Tatlı
        public string Drink { get; set; } = string.Empty;    // İçecek
        
        public int TotalCalories { get; set; } 
    }
}