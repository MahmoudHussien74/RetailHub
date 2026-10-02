using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RetailHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductUnitsAndUnitSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "BaseQuantity",
                table: "ReturnInvoiceItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ConversionFactor",
                table: "ReturnInvoiceItems",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<string>(
                name: "UnitName",
                table: "ReturnInvoiceItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "وحدة");

            migrationBuilder.AddColumn<int>(
                name: "BaseQuantity",
                table: "InvoiceItems",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "ConversionFactor",
                table: "InvoiceItems",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<Guid>(
                name: "UnitId",
                table: "InvoiceItems",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UnitName",
                table: "InvoiceItems",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "وحدة");

            migrationBuilder.CreateTable(
                name: "ProductUnits",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ProductId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ConversionFactor = table.Column<int>(type: "int", nullable: false),
                    SalePrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Barcode = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    IsDefaultSale = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProductUnits", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProductUnits_Products_ProductId",
                        column: x => x.ProductId,
                        principalTable: "Products",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceItems_UnitId",
                table: "InvoiceItems",
                column: "UnitId");

            migrationBuilder.CreateIndex(
                name: "IX_ProductUnits_Barcode",
                table: "ProductUnits",
                column: "Barcode",
                unique: true,
                filter: "[Barcode] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ProductUnits_ProductId",
                table: "ProductUnits",
                column: "ProductId");

            migrationBuilder.AddForeignKey(
                name: "FK_InvoiceItems_ProductUnits_UnitId",
                table: "InvoiceItems",
                column: "UnitId",
                principalTable: "ProductUnits",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            // ── Data Backfill ──

            // 1. Create a default ProductUnit for every existing Product
            migrationBuilder.Sql(@"
                INSERT INTO [ProductUnits] ([Id], [ProductId], [Name], [ConversionFactor], [SalePrice], [Barcode], [IsDefaultSale], [CreatedAt])
                SELECT NEWID(), p.[Id], N'وحدة', 1, p.[SellingPrice], p.[Barcode], 1, GETUTCDATE()
                FROM [Products] p
            ");

            // 2. Backfill BaseQuantity = Quantity for existing InvoiceItems (ConversionFactor=1)
            migrationBuilder.Sql(@"
                UPDATE [InvoiceItems] SET [BaseQuantity] = [Quantity] WHERE [BaseQuantity] = 0
            ");

            // 3. Backfill BaseQuantity = Quantity for existing ReturnInvoiceItems (ConversionFactor=1)
            migrationBuilder.Sql(@"
                UPDATE [ReturnInvoiceItems] SET [BaseQuantity] = [Quantity] WHERE [BaseQuantity] = 0
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_InvoiceItems_ProductUnits_UnitId",
                table: "InvoiceItems");

            migrationBuilder.DropTable(
                name: "ProductUnits");

            migrationBuilder.DropIndex(
                name: "IX_InvoiceItems_UnitId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "BaseQuantity",
                table: "ReturnInvoiceItems");

            migrationBuilder.DropColumn(
                name: "ConversionFactor",
                table: "ReturnInvoiceItems");

            migrationBuilder.DropColumn(
                name: "UnitName",
                table: "ReturnInvoiceItems");

            migrationBuilder.DropColumn(
                name: "BaseQuantity",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "ConversionFactor",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "UnitId",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "UnitName",
                table: "InvoiceItems");
        }
    }
}
