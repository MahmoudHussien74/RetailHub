using Mapster;
using RetailHub.Application.Features.Batches.DTOs;
using RetailHub.Application.Features.Brands.DTOs;
using RetailHub.Application.Features.Categories.DTOs;
using RetailHub.Application.Features.StockMovements.DTOs;
using RetailHub.Application.Features.Warehouses.DTOs;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Common.Mappings;

/// <summary>
/// Centralized Mapster configuration for all DTOs.
/// Lives in Application layer alongside DTOs — not in Infrastructure.
/// Simple flat DTOs use convention-based mapping (no config needed).
/// Complex computed mappings are configured here.
/// </summary>
public class MappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // Category -> CategoryDto: convention-based (all properties match by name)

        // Brand -> BrandDto: convention-based

        // Warehouse -> WarehouseDto: convention-based

        // Batch -> BatchDto: convention-based

        // StockMovement -> StockMovementDto: Type enum needs string conversion
        config.NewConfig<StockMovement, StockMovementDto>()
            .Map(dest => dest.Type, src => src.Type.ToString());
    }
}
