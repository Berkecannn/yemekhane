namespace YemekhaneApi.Models
{
    public class User
    {
        public int Id { get; set; }
        public string StudentNumber { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public decimal Balance { get; set; } // Öğrencinin güncel bakiyesi
    }
}