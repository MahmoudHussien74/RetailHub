using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Suppliers.Commands.UpdateSupplier;

public class UpdateSupplierCommandHandler : IRequestHandler<UpdateSupplierCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public UpdateSupplierCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(UpdateSupplierCommand request, CancellationToken ct)
    {
        var supplier = await _unitOfWork.Suppliers.GetByIdAsync(request.Id, ct);
        if (supplier is null)
            return Result.Failure(_localizer[MessageKeys.SupplierNotFound]);

        if (await _unitOfWork.Suppliers.ExistsByNameAsync(request.Name, request.Id, ct))
            return Result.Failure(string.Format(
                _localizer[MessageKeys.SupplierAlreadyExists], request.Name));

        supplier.Update(request.Name, request.Phone, request.Address);
        _unitOfWork.Suppliers.Update(supplier);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
