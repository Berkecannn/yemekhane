using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YemekhaneApi.Migrations
{
    /// <inheritdoc />
    public partial class AdSoyadAyrildi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "FullName",
                table: "Students",
                newName: "LastName");

            migrationBuilder.AddColumn<string>(
                name: "FirstName",
                table: "Students",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FirstName",
                table: "Students");

            migrationBuilder.RenameColumn(
                name: "LastName",
                table: "Students",
                newName: "FullName");
        }
    }
}
