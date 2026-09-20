using Mapster;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Common.Mappings;

/// <summary>
/// Centralized Mapster configuration for all DTOs.
/// Lives in Application layer alongside DTOs — not in Infrastructure.
/// Complex computed mappings (e.g., TotalStock from Batches) go here.
/// </summary>
public class MappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        // Placeholder — specific DTO mappings will be added as features are built.
        // Example of a complex mapping that would go here:
        // config.NewConfig<Product, ProductListDto>()
        //     .Map(dest => dest.TotalStock, src => src.Batches.Where(b => b.Quantity > 0).Sum(b => b.Quantity))
        //     .Map(dest => dest.CategoryName, src => src.Category.Name)
        //     .Map(dest => dest.BrandName, src => src.Brand.Name);
    }
}
