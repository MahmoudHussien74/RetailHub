using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Brands.Commands.DeleteBrand;

public record DeleteBrandCommand(Guid Id) : IRequest<Result>;
