using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.Batches.Commands.AddBatch;

public record AddBatchCommand(
    Guid ProductId,
    Guid WarehouseId,
    decimal PurchasePrice,
    int Quantity,
    DateTime ExpiryDate,
    Guid? SupplierId = null) : IRequest<Result<Guid>>;
