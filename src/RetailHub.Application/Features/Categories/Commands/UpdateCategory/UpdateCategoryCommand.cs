using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Categories.Commands.UpdateCategory;

public record UpdateCategoryCommand(
    Guid Id,
    string NameAr,
    string? NameEn,
    string? DescriptionAr,
    string? DescriptionEn) : IRequest<Result>;
