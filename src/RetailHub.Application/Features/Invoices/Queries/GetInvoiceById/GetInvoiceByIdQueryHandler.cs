using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Invoices.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Invoices.Queries.GetInvoiceById;

public class GetInvoiceByIdQueryHandler
    : IRequestHandler<GetInvoiceByIdQuery, Result<InvoiceDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetInvoiceByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<InvoiceDetailDto>> Handle(
        GetInvoiceByIdQuery request, CancellationToken ct)
    {
        // Projection query — AsNoTracking via IAppDbContext, no Include needed
        var invoice = await _context.Invoices
            .Where(i => i.Id == request.Id)
            .Select(i => new InvoiceDetailDto
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerId = i.CustomerId,
                PaymentStatus = i.PaymentStatus.ToString(),
                TotalAmount = i.TotalAmount,
                AmountPaid = i.AmountPaid,
                IsVoided = i.IsVoided,
                CreatedAt = i.CreatedAt,
                Items = i.Items.Select(ii => new InvoiceItemDto
                {
                    Id = ii.Id,
                    ProductId = ii.ProductId,
                    ProductNameAr = ii.Product.NameAr,
                    ProductNameEn = ii.Product.NameEn,
                    BatchId = ii.BatchId,
                    Quantity = ii.Quantity,
                    UnitPriceAtSale = ii.UnitPriceAtSale,
                    UnitCostAtSale = ii.UnitCostAtSale,
                    LineTotal = ii.Quantity * ii.UnitPriceAtSale
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (invoice is null)
            return Result<InvoiceDetailDto>.Failure(_localizer[MessageKeys.InvoiceNotFound]);

        return Result<InvoiceDetailDto>.Success(invoice);
    }
}
