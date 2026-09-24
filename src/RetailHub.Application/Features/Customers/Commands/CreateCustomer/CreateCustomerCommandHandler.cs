using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Customers.Commands.CreateCustomer;

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateCustomerCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateCustomerCommand request, CancellationToken ct)
    {
        // Check unique phone
        if (await _unitOfWork.Customers.ExistsByPhoneAsync(request.Phone, ct))
            return Result<Guid>.Failure(string.Format(
                _localizer[MessageKeys.CustomerPhoneExists], request.Phone));

        var customer = Customer.Create(request.Name, request.Phone, request.Address);
        await _unitOfWork.Customers.AddAsync(customer, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(customer.Id);
    }
}
