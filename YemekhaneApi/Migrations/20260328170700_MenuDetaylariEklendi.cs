using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YemekhaneApi.Migrations
{
    /// <inheritdoc />
    public partial class MenuDetaylariEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Dessert",
                table: "Menus",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Drink",
                table: "Menus",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SideDish",
                table: "Menus",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Dessert",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "Drink",
                table: "Menus");

            migrationBuilder.DropColumn(
                name: "SideDish",
                table: "Menus");
        }
    }
}
