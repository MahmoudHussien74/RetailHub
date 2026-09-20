using System.Reflection;
using FluentValidation;
using Mapster;
using MapsterMapper;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using RetailHub.Application.Common.Behaviors;

namespace RetailHub.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        // MediatR — auto-discover all Handlers in this assembly
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);

            // Register ValidationBehavior in the pipeline (runs before every Handler)
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        // FluentValidation — auto-discover all Validators in this assembly
        services.AddValidatorsFromAssembly(assembly);

        // Mapster — register centralized config + IMapper
        var config = TypeAdapterConfig.GlobalSettings;
        config.Scan(assembly);
        services.AddSingleton(config);
        services.AddScoped<IMapper, ServiceMapper>();

        return services;
    }
}
