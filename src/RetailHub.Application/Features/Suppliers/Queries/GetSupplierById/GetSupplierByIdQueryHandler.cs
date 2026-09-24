using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Suppliers.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Suppliers.Queries.GetSupplierById;

public class GetSupplierByIdQueryHandler
    : IRequestHandler<GetSupplierByIdQuery, Result<SupplierDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetSupplierByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<SupplierDetailDto>> Handle(
        GetSupplierByIdQuery request, CancellationToken ct)
    {
        var supplier = await _context.Suppliers
            .Where(s => s.Id == request.Id)
            .Select(s => new SupplierDetailDto
            {
                Id = s.Id,
                Name = s.Name,
                Phone = s.Phone,
                Address = s.Address,
                IsActive = s.IsActive,
                PurchaseInvoiceCount = s.PurchaseInvoices.Count,
                CreatedAt = s.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        return supplier is not null
            ? Result<SupplierDetailDto>.Success(supplier)
            : Result<SupplierDetailDto>.Failure(_localizer[MessageKeys.SupplierNotFound]);
    }
}
