using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Purchases.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Purchases.Queries.GetPurchaseInvoiceById;

public class GetPurchaseInvoiceByIdQueryHandler
    : IRequestHandler<GetPurchaseInvoiceByIdQuery, Result<PurchaseInvoiceDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetPurchaseInvoiceByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<PurchaseInvoiceDetailDto>> Handle(
        GetPurchaseInvoiceByIdQuery request, CancellationToken ct)
    {
        var invoice = await _context.PurchaseInvoices
            .Where(p => p.Id == request.Id)
            .Select(p => new PurchaseInvoiceDetailDto
            {
                Id = p.Id,
                InvoiceNumber = p.InvoiceNumber,
                SupplierId = p.SupplierId,
                SupplierName = p.Supplier.Name,
                TotalAmount = p.TotalAmount,
                PurchaseDate = p.PurchaseDate,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                Items = p.Items.Select(i => new PurchaseInvoiceItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductNameAr = i.Product.NameAr,
                    ProductNameEn = i.Product.NameEn,
                    Quantity = i.Quantity,
                    UnitCost = i.UnitCost,
                    LineTotal = i.Quantity * i.UnitCost,
                    ExpiryDate = i.ExpiryDate,
                    BatchId = i.BatchId
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);

        return invoice is not null
            ? Result<PurchaseInvoiceDetailDto>.Success(invoice)
            : Result<PurchaseInvoiceDetailDto>.Failure(_localizer[MessageKeys.PurchaseInvoiceNotFound]);
    }
}
