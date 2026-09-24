using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Suppliers.Commands.CreateSupplier;

public record CreateSupplierCommand(
    string Name,
    string? Phone = null,
    string? Address = null) : IRequest<Result<Guid>>;
