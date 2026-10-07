namespace YemekhaneApi.Models
{
    public class Admin
    {
        public int Id { get; set; }
        public string UniversityName { get; set; } = string.Empty; // En kritik alan
        public string FullName { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
    }
}