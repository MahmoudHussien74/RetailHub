using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Categories.Commands.DeleteCategory;

public record DeleteCategoryCommand(Guid Id) : IRequest<Result>;
