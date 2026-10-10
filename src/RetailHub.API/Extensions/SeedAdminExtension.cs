using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RetailHub.Infrastructure.Identity;

namespace RetailHub.API.Extensions;

/// <summary>
/// Seeds the initial Admin user on application startup (only if no users exist).
/// </summary>
public static class SeedAdminExtension
{
    public static async Task SeedDefaultAdmin(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<AppUser>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<AppRole>>();

        // Only seed if no users exist
        if (await userManager.Users.AnyAsync())
            return;

        // Ensure roles exist
        string[] roles = ["Admin", "Cashier", "InventoryManager"];
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new AppRole(role));
        }

        // Create default Admin
        var admin = new AppUser
        {
            FullName = "مدير النظام",
            UserName = "admin",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(admin, "Admin@123");
        if (result.Succeeded)
        {
            await userManager.AddToRoleAsync(admin, "Admin");
            Console.WriteLine("✅ Default admin created: admin / Admin@123");
        }
    }
}
