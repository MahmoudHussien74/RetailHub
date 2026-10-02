using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.ProductUnits.Commands.DeleteProductUnit;

public class DeleteProductUnitCommandHandler
    : IRequestHandler<DeleteProductUnitCommand, Result<bool>>
{
    private readonly IUnitOfWork _unitOfWork;

    public DeleteProductUnitCommandHandler(IUnitOfWork unitOfWork) =>
        _unitOfWork = unitOfWork;

    public async Task<Result<bool>> Handle(DeleteProductUnitCommand request, CancellationToken ct)
    {
        var unit = await _unitOfWork.ProductUnits.GetByIdAsync(request.UnitId, ct);
        if (unit is null)
            return Result<bool>.Failure("وحدة المنتج غير موجودة.");

        // Ensure at least one unit remains for the product
        var siblings = await _unitOfWork.ProductUnits.GetByProductIdAsync(unit.ProductId, ct);
        if (siblings.Count <= 1)
            return Result<bool>.Failure("لا يمكن حذف آخر وحدة للمنتج. يجب أن يحتوي المنتج على وحدة واحدة على الأقل.");

        _unitOfWork.ProductUnits.Remove(unit);

        // If deleted unit was default, assign default to first remaining
        if (unit.IsDefaultSale)
        {
            var newDefault = siblings.First(u => u.Id != unit.Id);
            newDefault.Update(newDefault.Name, newDefault.ConversionFactor, newDefault.SalePrice, newDefault.Barcode, true);
            _unitOfWork.ProductUnits.Update(newDefault);
        }

        await _unitOfWork.SaveChangesAsync(ct);
        return Result<bool>.Success(true);
    }
}
