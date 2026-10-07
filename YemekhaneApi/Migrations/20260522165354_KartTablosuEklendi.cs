using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace YemekhaneApi.Migrations
{
    /// <inheritdoc />
    public partial class KartTablosuEklendi : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SavedCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    StudentNumber = table.Column<string>(type: "TEXT", nullable: false),
                    CardAlias = table.Column<string>(type: "TEXT", nullable: false),
                    MaskedCardNumber = table.Column<string>(type: "TEXT", nullable: false),
                    EncryptedCardData = table.Column<string>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SavedCards", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SavedCards");
        }
    }
}
