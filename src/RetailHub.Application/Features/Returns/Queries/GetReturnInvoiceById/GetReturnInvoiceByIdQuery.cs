using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Returns.DTOs;

namespace RetailHub.Application.Features.Returns.Queries.GetReturnInvoiceById;

public record GetReturnInvoiceByIdQuery(Guid Id) : IRequest<Result<ReturnInvoiceDetailDto>>;
