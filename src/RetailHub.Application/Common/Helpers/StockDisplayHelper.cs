using RetailHub.Application.Features.ProductUnits.DTOs;

namespace RetailHub.Application.Common.Helpers;

public static class StockDisplayHelper
{
    /// <summary>
    /// Formats total base units into a friendly mixed units string (e.g. "84 علبة + 7 قرص").
    /// Considers units ordered by ConversionFactor descending.
    /// </summary>
    public static string FormatMixedStock(int totalStock, IEnumerable<ProductUnitDto> units)
    {
        var unitList = units?.ToList() ?? [];
        if (unitList.Count == 0)
            return $"{totalStock} وحدة";

        if (totalStock <= 0)
        {
            var baseUnit = unitList.OrderBy(u => u.ConversionFactor).FirstOrDefault();
            return $"0 {baseUnit?.Name ?? "وحدة"}".Trim();
        }

        var sortedUnits = unitList
            .Where(u => u.ConversionFactor > 0)
            .OrderByDescending(u => u.ConversionFactor)
            .ToList();

        var parts = new List<string>();
        var remaining = totalStock;

        foreach (var unit in sortedUnits)
        {
            if (remaining <= 0)
                break;

            var count = remaining / unit.ConversionFactor;
            if (count > 0)
            {
                parts.Add($"{count} {unit.Name}");
                remaining %= unit.ConversionFactor;
            }
        }

        if (remaining > 0)
        {
            var smallestUnit = sortedUnits.Last();
            parts.Add($"{remaining} {smallestUnit.Name}");
        }

        return parts.Count > 0 ? string.Join(" + ", parts) : "0";
    }
}
