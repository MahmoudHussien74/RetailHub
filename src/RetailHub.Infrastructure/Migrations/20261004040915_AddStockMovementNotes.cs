using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetailHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStockMovementNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "StockMovements",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notes",
                table: "StockMovements");
        }
    }
}
