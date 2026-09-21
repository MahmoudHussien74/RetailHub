using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Batches.DTOs;

namespace RetailHub.Application.Features.Batches.Queries.GetBatchesByProduct;

public record GetBatchesByProductQuery(
    Guid ProductId,
    int Page = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<BatchDto>>>;
