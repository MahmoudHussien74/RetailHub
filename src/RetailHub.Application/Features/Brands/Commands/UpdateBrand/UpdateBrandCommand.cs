using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Brands.Commands.UpdateBrand;

public record UpdateBrandCommand(Guid Id, string NameAr, string? NameEn) : IRequest<Result>;
