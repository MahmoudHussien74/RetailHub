using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.ProductUnits.Commands.DeleteProductUnit;

public record DeleteProductUnitCommand(Guid UnitId) : IRequest<Result<bool>>;
