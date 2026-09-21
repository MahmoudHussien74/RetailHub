using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Categories.DTOs;

namespace RetailHub.Application.Features.Categories.Queries.GetAllCategories;

public record GetAllCategoriesQuery(int Page = 1, int PageSize = 10) : IRequest<Result<PagedResult<CategoryDto>>>;
