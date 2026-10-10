using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using RetailHub.Application.Interfaces;
using RetailHub.Infrastructure.Identity;
using RetailHub.Infrastructure.Persistence;

namespace RetailHub.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Determine database provider from config (default: SqlServer)
        var provider = configuration.GetValue<string>("DatabaseProvider") ?? "SqlServer";

        services.AddDbContext<AppDbContext>(options =>
        {
            if (provider.Equals("Sqlite", StringComparison.OrdinalIgnoreCase))
            {
                // Desktop mode: use a local SQLite file in AppData
                var appDataDir = Path.Combine(
                    Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                    "RetailHub");
                Directory.CreateDirectory(appDataDir);

                var dbPath = Path.Combine(appDataDir, "RetailHub.db");
                options.UseSqlite($"Data Source={dbPath}");
            }
            else
            {
                // Server / development mode: use SQL Server
                options.UseSqlServer(
                    configuration.GetConnectionString("DefaultConnection"),
                    sqlOptions => sqlOptions.MigrationsAssembly(
                        typeof(AppDbContext).Assembly.FullName));
            }
        });

        // ASP.NET Core Identity
        services.AddIdentity<AppUser, AppRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = false;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        // JWT Settings
        services.Configure<JwtSettings>(configuration.GetSection(JwtSettings.SectionName));

        // Auth Service
        services.AddScoped<IAuthService, AuthService>();

        // Register IAppDbContext (for Query handlers) and IUnitOfWork (for Command handlers)
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        return services;
    }
}
