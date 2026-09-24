using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Suppliers.Commands.UpdateSupplier;

public record UpdateSupplierCommand(
    Guid Id,
    string Name,
    string? Phone = null,
    string? Address = null) : IRequest<Result>;
