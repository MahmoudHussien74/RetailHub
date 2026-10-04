using MediatR;
using RetailHub.Application.Common;

namespace RetailHub.Application.Features.StockAdjustments.Commands.AdjustStock;

public enum StockAdjustmentKind
{
    /// <summary>Remove damaged / expired / lost units from a batch. Quantity = units to remove.</summary>
    WriteOff = 1,

    /// <summary>Stock-take: set a batch to the physically counted quantity. Quantity = counted units.</summary>
    Count = 2
}

/// <summary>
/// All quantities are expressed in BASE units (the smallest unit, ConversionFactor = 1).
/// </summary>
public record AdjustStockCommand(
    Guid ProductId,
    Guid BatchId,
    StockAdjustmentKind Kind,
    int Quantity,
    string Reason) : IRequest<Result<Guid>>;
