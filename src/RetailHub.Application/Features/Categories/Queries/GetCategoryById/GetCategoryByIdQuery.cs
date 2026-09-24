using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Categories.DTOs;

namespace RetailHub.Application.Features.Categories.Queries.GetCategoryById;

public record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;
