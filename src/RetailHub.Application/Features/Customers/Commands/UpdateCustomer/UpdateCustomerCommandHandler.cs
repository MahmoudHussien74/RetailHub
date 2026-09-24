using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Customers.Commands.UpdateCustomer;

public class UpdateCustomerCommandHandler : IRequestHandler<UpdateCustomerCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateCustomerCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(UpdateCustomerCommand request, CancellationToken ct)
    {
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.Id, ct);
        if (customer is null)
            return Result.Failure(_localizer[MessageKeys.CustomerNotFound]);

        // Check unique phone (exclude current customer)
        if (await _unitOfWork.Customers.ExistsByPhoneAsync(request.Phone, request.Id, ct))
            return Result.Failure(string.Format(
                _localizer[MessageKeys.CustomerPhoneExists], request.Phone));

        customer.Update(request.Name, request.Phone, request.Address);
        _unitOfWork.Customers.Update(customer);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
