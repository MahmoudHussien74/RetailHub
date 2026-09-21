using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Categories.Commands.CreateCategory;

public record CreateCategoryCommand(
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    string? DescriptionEn) : IRequest<Result<Guid>>;
