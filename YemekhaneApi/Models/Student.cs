namespace YemekhaneApi.Models
{
    public class Student
    {
        public int Id { get; set; }
        
        // FullName yerine Ad ve Soyad ayrı ayrı alındı
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        
        public string StudentNumber { get; set; } = string.Empty;
        public double Balance { get; set; } 
        public string PasswordHash { get; set; } = string.Empty;
        public string UniversityName { get; set; } = string.Empty;
    }
}