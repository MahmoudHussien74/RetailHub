using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Features.Customers.DTOs;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Customers.Queries.GetCustomerById;

public class GetCustomerByIdQueryHandler
    : IRequestHandler<GetCustomerByIdQuery, Result<CustomerDetailDto>>
{
    private readonly IAppDbContext _context;
    private readonly IStringLocalizer<Messages> _localizer;

    public GetCustomerByIdQueryHandler(IAppDbContext context, IStringLocalizer<Messages> localizer)
    {
        _context = context;
        _localizer = localizer;
    }

    public async Task<Result<CustomerDetailDto>> Handle(
        GetCustomerByIdQuery request, CancellationToken ct)
    {
        var customer = await _context.Customers
            .Where(c => c.Id == request.Id)
            .Select(c => new CustomerDetailDto
            {
                Id = c.Id,
                Name = c.Name,
                Phone = c.Phone,
                Address = c.Address,
                Balance = c.Balance,
                IsActive = c.IsActive,
                InvoiceCount = c.Invoices.Count,
                CreatedAt = c.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        return customer is not null
            ? Result<CustomerDetailDto>.Success(customer)
            : Result<CustomerDetailDto>.Failure(_localizer[MessageKeys.CustomerNotFound]);
    }
}
