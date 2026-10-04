namespace RetailHub.Application.Features.StockAdjustments.DTOs;

public class StockAdjustmentDto
{
    public Guid Id { get; init; }
    public Guid ProductId { get; init; }
    public string ProductNameAr { get; init; } = string.Empty;
    public string Barcode { get; init; } = string.Empty;
    public Guid BatchId { get; init; }
    public DateTime BatchExpiryDate { get; init; }

    /// <summary>"Damage" (write-off) or "Adjustment" (stock-take).</summary>
    public string Type { get; init; } = string.Empty;

    /// <summary>Base units. Damage: positive = removed. Adjustment: signed (negative = shortage).</summary>
    public int Quantity { get; init; }

    public decimal UnitCost { get; init; }

    /// <summary>Money impact: negative = loss, positive = surplus.</summary>
    public decimal ValueImpact { get; init; }

    public string? Notes { get; init; }
    public DateTime MovementDate { get; init; }
}

public class StockAdjustmentSummaryDto
{
    public decimal TotalLoss { get; init; }
    public decimal TotalSurplus { get; init; }
    public int WriteOffCount { get; init; }
    public int AdjustmentCount { get; init; }
}

public class StockAdjustmentListDto
{
    public StockAdjustmentSummaryDto Summary { get; init; } = new();
    public RetailHub.Application.Common.PagedResult<StockAdjustmentDto> Page { get; init; } = null!;
}
