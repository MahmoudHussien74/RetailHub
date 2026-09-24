using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Suppliers.Commands.CreateSupplier;

public class CreateSupplierCommandHandler : IRequestHandler<CreateSupplierCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public CreateSupplierCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(CreateSupplierCommand request, CancellationToken ct)
    {
        if (await _unitOfWork.Suppliers.ExistsByNameAsync(request.Name, ct))
            return Result<Guid>.Failure(string.Format(
                _localizer[MessageKeys.SupplierAlreadyExists], request.Name));

        var supplier = Supplier.Create(request.Name, request.Phone, request.Address);
        await _unitOfWork.Suppliers.AddAsync(supplier, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(supplier.Id);
    }
}
