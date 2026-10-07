using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YemekhaneApi.Migrations
{
    /// <inheritdoc />
    public partial class OkulAdiEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "UniversityName",
                table: "Students",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UniversityName",
                table: "Students");
        }
    }
}
