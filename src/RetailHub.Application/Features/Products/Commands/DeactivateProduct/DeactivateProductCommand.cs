using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Products.Commands.DeactivateProduct;

public record DeactivateProductCommand(Guid Id) : IRequest<Result>;
