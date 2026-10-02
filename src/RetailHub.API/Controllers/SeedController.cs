using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailHub.API.Common;
using RetailHub.Domain.Entities;
using RetailHub.Infrastructure.Persistence;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SeedController : ControllerBase
{
    private readonly AppDbContext _context;

    public SeedController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Seeds realistic, comprehensive pharmacy data (Medicines, Antibiotics, Vitamins, Cosmetics, Batches, Suppliers, Customers).
    /// </summary>
    [HttpPost("pharmacy")]
    public async Task<IActionResult> SeedPharmacy(CancellationToken ct)
    {
        // ── 1. Ensure Default Warehouse ──
        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.IsDefault, ct);
        if (warehouse is null)
        {
            warehouse = Warehouse.Create("المستودع الرئيسي للصيدلية", "الدقي - الجيزة", isDefault: true);
            await _context.Warehouses.AddAsync(warehouse, ct);
            await _context.SaveChangesAsync(ct);
        }

        // ── 2. Pharmacy Categories ──
        var categoriesMap = new Dictionary<string, Category>();
        var categoriesData = new (string Ar, string En, string Desc)[]
        {
            ("مسكنات ومضادات التهاب", "Analgesics & Anti-inflammatory", "أدوية تسكين الآلام وخفض الحرارة ومضادات الروماتيزم"),
            ("مضادات حيوية", "Antibiotics", "المضادات الحيوية واسعة المجال والكبسولات والشراب"),
            ("أدوية الضغط والقلب", "Cardiovascular", "أدوية تنظيم ضغط الدم وصحة القلب والشرايين"),
            ("أدوية السكر والغدد", "Diabetes & Endocrine", "منظمات السكر وأنسولين وأدوية الغدة"),
            ("الجهاز الهضمي والقولون", "Gastrointestinal", "مضادات الحموضة وعلاج القولون والمطهرات المعوية"),
            ("فيتامينات ومكملات غذائية", "Vitamins & Supplements", "فيتامينات ب المركبة، فيتامين سي، الحديد، والكالسيوم"),
            ("أدوية البرد والحساسية", "Cold & Allergy", "مضادات الهيستامين، علاج الرشح، وبخاخات الأنف"),
            ("عناية بالبشرة ومستحضرات تجميل", "Dermocosmetics & Skincare", "مرطبات طبية، واقيات شمس، وعلاج الحروق"),
            ("مستلزمات طبية وإسعافات", "Medical Supplies & First Aid", "كحول، قطن، شاش، بلاستر، وجوانات طبية")
        };

        foreach (var (ar, en, desc) in categoriesData)
        {
            var existing = await _context.Categories.FirstOrDefaultAsync(c => c.NameAr == ar, ct);
            if (existing is null)
            {
                existing = Category.Create(ar, en, desc, en);
                await _context.Categories.AddAsync(existing, ct);
            }
            categoriesMap[ar] = existing;
        }
        await _context.SaveChangesAsync(ct);

        // ── 3. Pharmaceutical Brands / Companies ──
        var brandsMap = new Dictionary<string, Brand>();
        var brandsData = new (string Ar, string En)[]
        {
            ("جلاكسو سميث كلاين (GSK)", "GlaxoSmithKline (GSK)"),
            ("فايزر مصر (Pfizer)", "Pfizer Egypt"),
            ("نوفارتس (Novartis)", "Novartis Pharma"),
            ("سانوفي (Sanofi)", "Sanofi Aventis"),
            ("إيفا فارما (Eva Pharma)", "Eva Pharma"),
            ("أمون للأدوية (Amoun)", "Amoun Pharmaceutical"),
            ("فاركو للأدوية (Pharco)", "Pharco Pharmaceuticals"),
            ("إيبيكو (EIPICO)", "EIPICO Egypt"),
            ("باير (Bayer)", "Bayer Healthcare"),
            ("لاروش بوزيه (La Roche-Posay)", "La Roche-Posay")
        };

        foreach (var (ar, en) in brandsData)
        {
            var existing = await _context.Brands.FirstOrDefaultAsync(b => b.NameAr == ar, ct);
            if (existing is null)
            {
                existing = Brand.Create(ar, en);
                await _context.Brands.AddAsync(existing, ct);
            }
            brandsMap[ar] = existing;
        }
        await _context.SaveChangesAsync(ct);

        // ── 4. Pharmacy Suppliers ──
        var suppliersMap = new Dictionary<string, Supplier>();
        var suppliersData = new (string Name, string Phone, string Address)[]
        {
            ("الشركة المصرية لتجارة الأدوية", "01001234567", "فرع قصر العيني - القاهرة"),
            ("شركة فارما أوفرسيز", "01112345678", "المنطقة الصناعية - 6 أكتوبر"),
            ("شركة ابن سينا فارما", "01223456789", "مصر الجديدة - القاهرة"),
            ("شركة مالتي فارما للخدمات الدوائية", "01551234567", "المعادي - القاهرة")
        };

        foreach (var (name, phone, address) in suppliersData)
        {
            var existing = await _context.Suppliers.FirstOrDefaultAsync(s => s.Name == name, ct);
            if (existing is null)
            {
                existing = Supplier.Create(name, phone, address);
                await _context.Suppliers.AddAsync(existing, ct);
            }
            suppliersMap[name] = existing;
        }
        await _context.SaveChangesAsync(ct);

        // ── 5. Pharmacy Customers ──
        var customersData = new (string Name, string Phone, string Address)[]
        {
            ("د. أحمد عبد العزيز (عيادة باطنة)", "01011122233", "الدقي - شارع مصدق"),
            ("م. هاني الشافعي (علاج شهري منتظم)", "01122233344", "المهندسين - شارع سوريا"),
            ("أ. سارة ممدوح (عميلة عناية وتجميل)", "01233344455", "الزمالك - القاهرة"),
            ("الحاج مصطفى رضوان (علاج ضغط وسكر)", "01544455566", "العجوزة - الجيزة")
        };

        foreach (var (name, phone, address) in customersData)
        {
            var existing = await _context.Customers.FirstOrDefaultAsync(c => c.Name == name, ct);
            if (existing is null)
            {
                existing = Customer.Create(name, phone, address);
                await _context.Customers.AddAsync(existing, ct);
            }
        }
        await _context.SaveChangesAsync(ct);

        // ── 6. Pharmacy Employees ──
        var employeesData = new (string Name, decimal Salary, string Phone, string Role)[]
        {
            ("د. نهى سليمان", 12000m, "01099887766", "مدير فرع الصيدلية"),
            ("د. أحمد صلاح", 9000m, "01188776655", "صيدلي وردية مسائية"),
            ("أ. كريم ممدوح", 5500m, "01277665544", "مساعد صيدلي وكاشير")
        };

        foreach (var (name, salary, phone, role) in employeesData)
        {
            var existing = await _context.Employees.FirstOrDefaultAsync(e => e.Name == name, ct);
            if (existing is null)
            {
                existing = Employee.Create(name, salary, phone, role);
                await _context.Employees.AddAsync(existing, ct);
            }
        }
        await _context.SaveChangesAsync(ct);

        // ── 7. Real Egyptian Pharmacy Products & Batches ──
        var defaultSupplier = suppliersMap["الشركة المصرية لتجارة الأدوية"];
        var altSupplier = suppliersMap["شركة ابن سينا فارما"];

        var productsData = new (string Barcode, string NameAr, string NameEn, string Cat, string Brand, decimal SellPrice, decimal Cost, int Qty, DateTime Expiry)[]
        {
            ("622300123401", "بانادول إكسترا 24 قرص", "Panadol Extra 24 Tabs", "مسكنات ومضادات التهاب", "جلاكسو سميث كلاين (GSK)", 45.00m, 36.00m, 150, DateTime.UtcNow.AddMonths(18)),
            ("622300123402", "بانادول أدفانس 24 قرص", "Panadol Advance 24 Tabs", "مسكنات ومضادات التهاب", "جلاكسو سميث كلاين (GSK)", 35.00m, 28.00m, 120, DateTime.UtcNow.AddMonths(24)),
            ("622300123403", "كتافلام 50 مجم 20 قرص", "Cataflam 50mg 20 Tabs", "مسكنات ومضادات التهاب", "نوفارتس (Novartis)", 55.00m, 44.00m, 90, DateTime.UtcNow.AddMonths(14)),
            ("622300123404", "فولتارين 100 مجم 5 أقماع", "Voltaren 100mg 5 Supp", "مسكنات ومضادات التهاب", "نوفارتس (Novartis)", 48.00m, 38.50m, 60, DateTime.UtcNow.AddMonths(12)),
            ("622300123405", "أوجمنتين 1 جم 14 قرص", "Augmentin 1g 14 Tabs", "مضادات حيوية", "جلاكسو سميث كلاين (GSK)", 135.00m, 108.00m, 75, DateTime.UtcNow.AddMonths(8)),
            ("622300123406", "كلافيموكس 1 جم 12 قرص", "Klavox 1g 12 Tabs", "مضادات حيوية", "إيبيكو (EIPICO)", 95.00m, 76.00m, 65, DateTime.UtcNow.AddMonths(16)),
            ("622300123407", "زيثروكان 500 مجم 3 كبسولات", "Zithrokan 500mg 3 Caps", "مضادات حيوية", "أمون للأدوية (Amoun)", 52.00m, 41.50m, 80, DateTime.UtcNow.AddMonths(20)),
            ("622300123408", "كونكور 5 مجم 30 قرص", "Concor 5mg 30 Tabs", "أدوية الضغط والقلب", "أمون للأدوية (Amoun)", 75.00m, 60.00m, 100, DateTime.UtcNow.AddMonths(22)),
            ("622300123409", "نورفاسك 5 مجم 30 قرص", "Norvasc 5mg 30 Tabs", "أدوية الضغط والقلب", "فايزر مصر (Pfizer)", 88.00m, 70.00m, 50, DateTime.UtcNow.AddMonths(15)),
            ("622300123410", "جلوكوفاج 1000 مجم 30 قرص", "Glucophage 1000mg 30 Tabs", "أدوية السكر والغدد", "سانوفي (Sanofi)", 65.00m, 52.00m, 110, DateTime.UtcNow.AddMonths(19)),
            ("622300123411", "أماريل 2 مجم 30 قرص", "Amaryl 2mg 30 Tabs", "أدوية السكر والغدد", "سانوفي (Sanofi)", 72.00m, 57.50m, 45, DateTime.UtcNow.AddMonths(11)),
            ("622300123412", "أوميبرال 20 مجم 14 كبسولة", "Omepral 20mg 14 Caps", "الجهاز الهضمي والقولون", "فاركو للأدوية (Pharco)", 50.00m, 40.00m, 85, DateTime.UtcNow.AddMonths(17)),
            ("622300123413", "كونترولوك 40 مجم 14 قرص", "Controloc 40mg 14 Tabs", "الجهاز الهضمي والقولون", "باير (Bayer)", 120.00m, 96.00m, 40, DateTime.UtcNow.AddMonths(10)),
            ("622300123414", "أنتينال 24 كبسولة", "Antinal 24 Caps", "الجهاز الهضمي والقولون", "أمون للأدوية (Amoun)", 38.00m, 30.00m, 140, DateTime.UtcNow.AddMonths(25)),
            ("622300123415", "كونجستال 20 قرص", "Congestal 20 Tabs", "أدوية البرد والحساسية", "سانوفي (Sanofi)", 31.00m, 24.50m, 160, DateTime.UtcNow.AddMonths(18)),
            ("622300123416", "كومتركس 20 قرص", "Comtrex 20 Tabs", "أدوية البرد والحساسية", "جلاكسو سميث كلاين (GSK)", 42.00m, 33.50m, 70, DateTime.UtcNow.AddMonths(21)),
            ("622300123417", "تلفاست 180 مجم 20 قرص", "Telfast 180mg 20 Tabs", "أدوية البرد والحساسية", "سانوفي (Sanofi)", 85.00m, 68.00m, 55, DateTime.UtcNow.AddMonths(13)),
            ("622300123418", "فيروجلوبين ب12 30 كبسولة", "Feroglobin B12 30 Caps", "فيتامينات ومكملات غذائية", "إيفا فارما (Eva Pharma)", 90.00m, 72.00m, 60, DateTime.UtcNow.AddMonths(20)),
            ("622300123419", "سي ريتارد 500 مجم 10 كبسولات", "C-Retard 500mg 10 Caps", "فيتامينات ومكملات غذائية", "إيبيكو (EIPICO)", 28.00m, 22.00m, 130, DateTime.UtcNow.AddMonths(15)),
            ("622300123420", "بيبانثين بلس كريم 30 جم", "Bepanthen Plus Cream 30g", "عناية بالبشرة ومستحضرات تجميل", "باير (Bayer)", 135.00m, 108.00m, 40, DateTime.UtcNow.AddMonths(26)),
            ("622300123421", "ميبو مرهم حروق وجروح 30 جم", "MEBO Ointment 30g", "عناية بالبشرة ومستحضرات تجميل", "إيفا فارما (Eva Pharma)", 85.00m, 68.00m, 65, DateTime.UtcNow.AddMonths(22)),
            ("622300123422", "لاروش أنثيليوس واقي شمس SPF50+", "La Roche Anthelios SPF50+ 50ml", "عناية بالبشرة ومستحضرات تجميل", "لاروش بوزيه (La Roche-Posay)", 550.00m, 440.00m, 25, DateTime.UtcNow.AddMonths(30)),
            ("622300123423", "كحول طبي إيثيلي 70% 250 مل", "Medical Ethyl Alcohol 70% 250ml", "مستلزمات طبية وإسعافات", "إيبيكو (EIPICO)", 25.00m, 18.00m, 100, DateTime.UtcNow.AddMonths(36)),
            ("622300123424", "جوانتيات طبية لاتكس 100 ق", "Latex Medical Gloves Box 100", "مستلزمات طبية وإسعافات", "إيفا فارما (Eva Pharma)", 175.00m, 140.00m, 30, DateTime.UtcNow.AddMonths(36))
        };

        var addedCount = 0;
        foreach (var p in productsData)
        {
            var category = categoriesMap[p.Cat];
            var brand = brandsMap[p.Brand];

            var existingProduct = await _context.Products
                .Include(prod => prod.Batches)
                .FirstOrDefaultAsync(prod => prod.Barcode == p.Barcode, ct);

            if (existingProduct is null)
            {
                var newProduct = Product.Create(
                    barcode: p.Barcode,
                    nameAr: p.NameAr,
                    nameEn: p.NameEn,
                    categoryId: category.Id,
                    brandId: brand.Id,
                    sellingPrice: p.SellPrice);

                await _context.Products.AddAsync(newProduct, ct);
                await _context.SaveChangesAsync(ct);

                // Add Batch 1 (Main stock)
                var batch1 = Batch.Create(
                    productId: newProduct.Id,
                    warehouseId: warehouse.Id,
                    purchasePrice: p.Cost,
                    quantity: p.Qty,
                    expiryDate: p.Expiry,
                    supplierId: defaultSupplier.Id);

                await _context.Batches.AddAsync(batch1, ct);

                // For some items add Batch 2 (Near expiry or fresh batch for FEFO testing)
                if (p.Qty >= 100)
                {
                    var batch2 = Batch.Create(
                        productId: newProduct.Id,
                        warehouseId: warehouse.Id,
                        purchasePrice: p.Cost * 0.95m,
                        quantity: 25,
                        expiryDate: DateTime.UtcNow.AddMonths(4), // Near Expiry!
                        supplierId: altSupplier.Id);

                    await _context.Batches.AddAsync(batch2, ct);
                }

                await _context.SaveChangesAsync(ct);

                // Recalculate Average Cost
                var availableBatches = await _context.Batches
                    .Where(b => b.ProductId == newProduct.Id && b.Quantity > 0)
                    .ToListAsync(ct);

                newProduct.RecalculateAverageCost(availableBatches);
                _context.Products.Update(newProduct);

                addedCount++;
            }
        }

        await _context.SaveChangesAsync(ct);

        return Ok(new ApiResponse<object>
        {
            Success = true,
            Message = $"تم تحميل بيانات الصيدلية بنجاح! تم تجهيز {addedCount} صنف جديد مع التشغيلات وتواريخ الصلاحية والتصنيفات والموردين.",
            Data = new
            {
                TotalProductsInDb = await _context.Products.CountAsync(ct),
                TotalBatchesInDb = await _context.Batches.CountAsync(ct),
                TotalCategories = await _context.Categories.CountAsync(ct),
                TotalSuppliers = await _context.Suppliers.CountAsync(ct),
                TotalCustomers = await _context.Customers.CountAsync(ct)
            }
        });
    }
}
