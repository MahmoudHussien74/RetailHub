using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Returns.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Returns.Queries.GetReturnInvoiceById;

public class GetReturnInvoiceByIdQueryHandler
    : IRequestHandler<GetReturnInvoiceByIdQuery, Result<ReturnInvoiceDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetReturnInvoiceByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<ReturnInvoiceDetailDto>> Handle(
        GetReturnInvoiceByIdQuery request, CancellationToken ct)
    {
        var returnInvoice = await _context.ReturnInvoices
            .Where(r => r.Id == request.Id)
            .Select(r => new ReturnInvoiceDetailDto
            {
                Id = r.Id,
                OriginalInvoiceId = r.OriginalInvoiceId,
                OriginalInvoiceNumber = r.OriginalInvoice.InvoiceNumber,
                CustomerId = r.CustomerId,
                CustomerName = r.Customer != null ? r.Customer.Name : null,
                TotalRefundAmount = r.TotalRefundAmount,
                ReturnDate = r.ReturnDate,
                Items = r.Items.Select(i => new ReturnInvoiceItemDto
                {
                    Id = i.Id,
                    ProductId = i.ProductId,
                    ProductNameAr = i.Product.NameAr,
                    ProductNameEn = i.Product.NameEn,
                    BatchId = i.BatchId,
                    Quantity = i.Quantity,
                    UnitPriceAtSale = i.UnitPriceAtSale,
                    LineTotal = i.Quantity * i.UnitPriceAtSale,
                    IsDamaged = i.IsDamaged
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);

        return returnInvoice is not null
            ? Result<ReturnInvoiceDetailDto>.Success(returnInvoice)
            : Result<ReturnInvoiceDetailDto>.Failure(_localizer[MessageKeys.ReturnInvoiceNotFound]);
    }
}
