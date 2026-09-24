using MediatR;
using Microsoft.EntityFrameworkCore;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Payments.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Payments.Queries.GetCustomerPayments;

public class GetCustomerPaymentsQueryHandler
    : IRequestHandler<GetCustomerPaymentsQuery, Result<PagedResult<PaymentListDto>>>
{
    private readonly IAppDbContext _context;

    public GetCustomerPaymentsQueryHandler(IAppDbContext context) => _context = context;

    public async Task<Result<PagedResult<PaymentListDto>>> Handle(
        GetCustomerPaymentsQuery request, CancellationToken ct)
    {
        var query = _context.Payments
            .Where(p => p.CustomerId == request.CustomerId);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .OrderByDescending(p => p.PaymentDate)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new PaymentListDto
            {
                Id = p.Id,
                CustomerId = p.CustomerId,
                InvoiceId = p.InvoiceId,
                InvoiceNumber = p.Invoice != null ? p.Invoice.InvoiceNumber : null,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                Notes = p.Notes
            })
            .ToListAsync(ct);

        var pagedResult = new PagedResult<PaymentListDto>(items, totalCount, request.Page, request.PageSize);
        return Result<PagedResult<PaymentListDto>>.Success(pagedResult);
    }
}
