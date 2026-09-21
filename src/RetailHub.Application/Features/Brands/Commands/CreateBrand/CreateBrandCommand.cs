using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Brands.Commands.CreateBrand;

public record CreateBrandCommand(string NameAr, string? NameEn) : IRequest<Result<Guid>>;
