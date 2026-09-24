using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Suppliers.DTOs;

namespace RetailHub.Application.Features.Suppliers.Queries.GetSupplierById;

public record GetSupplierByIdQuery(Guid Id) : IRequest<Result<SupplierDetailDto>>;
