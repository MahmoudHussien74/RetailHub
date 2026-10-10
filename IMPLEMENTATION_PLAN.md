# خطة التنفيذ الشاملة — RetailHub SaaS Architecture Modernization Plan

هذه الوثيقة تمثل خارطة الطريق التنفيذية الهندسية لتحويل مشروع **RetailHub** إلى نظام **SaaS متعدد المستأجرين (Multi-Tenant)** بمستوى إنتاجي عالي الجودة والجاهزية، مع معالجة كافة الثغرات المالية، مشاكل التزامن (Concurrency)، وأخطاء واجهة المستخدم.

---

## 🎯 الأهداف الأساسية للتحسين
1. **عزل كامل وموثوق للمستأجرين (Multi-Tenancy):** مستأجر لا يمكنه رؤية أو تعديل بيانات مستأجر آخر على مستوى قاعدة البيانات (`Global Query Filters`).
2. **أمان وحماية شاملة (Security & Auth):** تأمين الـ API بالكامل بواسطة ASP.NET Core Identity و JWT مع سياسات الصلاحيات (`Policy/Permission-based Authorization`).
3. **سلامة العمليات المالية والمخزنية (Integrity):** حماية المخزون من البيع المزدوج (`RowVersion / Optimistic Concurrency`)، تصحيح حسابات المرتجعات والإلغاءات، وضبط ورديات الكاشير.
4. **أداء عالي ومعالجة البيانات في قاعدة البيانات (DB Optimization):** منع تحميل الجداول بالكامل في الذاكرة RAM، وتوليد أرقام الفواتير عبر `SQL Sequences`.
5. **مرونة الأعمال (Configurable SaaS):** دعم أنشطة مختلفة (صيدليات، مستحضرات تجميل، محلات عامة) بإعدادات مرنة وقابلة للتخصيص دون تكرار الكود.
6. **بنية فرونت إند احترافية (Angular Clean Architecture):** تفتيت المكونات الضخمة (Fat Components)، تفعيل الوضع الصارم `Strict TypeScript`، ومنع تسريب الذاكرة (`Memory Leaks`).

---

## 📊 المراحل التنفيذية (Milestones Overview)

| المرحلة | العنوان | الهدف الرئيسي | الجهد المقدر | مستوى الخطورة |
| :---: | :--- | :--- | :---: | :---: |
| **المرحلة 1** | الأساس الأمني والعزل السحابي (Multi-Tenancy & Auth) | عزل المستأجرين وتأمين كافة الـ Endpoints | **L** (كبير) | **High** |
| **المرحلة 2** | سلامة المخزون والعمليات المالية (Inventory & Finance Integrity) | حماية التزامن، تصحيح المرتجعات، وتأمين الورديات | **M** (متوسط) | **High** |
| **المرحلة 3** | أداء الاستعلامات وتوليد الفواتير (Query Performance & Sequences) | SQL Aggregation و Sequences و ProblemDetails | **M** (متوسط) | **Medium** |
| **المرحلة 4** | إعدادات وتخصيص المستأجرين (Tenant Settings & Extensibility) | تخصيص الصيدليات ومستحضرات التجميل وقواعد العمل | **M** (متوسط) | **Low** |
| **المرحلة 5** | إعادة هيكلة واجهة المستخدم (Angular Clean Code & UI) | تفتيت المكونات، إصلاح السلة، وتفعيل الوضع الصارم | **L** (كبير) | **Medium** |
| **المرحلة 6** | الاختبارات الشاملة والمراقبة (Testing & Quality Gates) | تغطية اختبارية >80% للعمليات الحرجة وفحوصات الصحة | **M** (متوسط) | **Low** |

---

## 🛠️ التفاصيل التنفيذية لكل مرحلة

---

### المرحلة 1: الأساس الأمني وتعدد المستأجرين (Multi-Tenancy & Security)
> **الهدف:** منع التسريب الأمني وبناء الهيكل السحابي الأساسي.

#### 1.1 بناء طبقة المستأجرين في الدومين والبنية التحتية
- **الملفات المستهدفة:**
  - `src/RetailHub.Domain/Common/ITenantEntity.cs` (جديد)
  - `src/RetailHub.Domain/Entities/Tenant.cs` (جديد)
  - `src/RetailHub.Domain/Common/AuditableEntity.cs` (تعديل: إضافة `public Guid TenantId { get; set; }`)
  - `src/RetailHub.Application/Common/Interfaces/ITenantContext.cs` (جديد)
  - `src/RetailHub.Infrastructure/Services/TenantContext.cs` (جديد)
  - `src/RetailHub.Infrastructure/Persistence/AppDbContext.cs` (تعديل)
- **الخطوات:**
  1. إنشاء كيان `Tenant` يشمل: الاسم، الكود، الدومين الفرعي (`Subdomain`)، نوع النشاط (`BusinessSector: Pharmacy, Cosmetics, Retail`)، وحالة التفعيل.
  2. جعل `AuditableEntity` تنفذ واجهة `ITenantEntity` بإضافة حقل `TenantId`.
  3. تنفيذ `TenantContext` لقراءة `TenantId` من الـ `HttpContext` (عبر Header مخصص `X-Tenant-Id` أو `Subdomain` أو `JWT Claim`).
  4. في `AppDbContext`:
     - إضافة فلتر عام `modelBuilder.Entity<T>().HasQueryFilter(e => e.TenantId == _tenantContext.CurrentTenantId)`.
     - حقن الـ `TenantId` آلياً داخل `SaveChangesAsync` لأي كيان جديد من نوع `ITenantEntity`.

#### 1.2 تأمين الـ API والمصادقة (Authentication & Authorization)
- **الملفات المستهدفة:**
  - `src/RetailHub.Domain/Entities/AppUser.cs` & `AppRole.cs` (جديد - وراثة من Identity)
  - `src/RetailHub.Infrastructure/RetailHub.Infrastructure.csproj` (إضافة حزمة `Microsoft.AspNetCore.Identity.EntityFrameworkCore`)
  - `src/RetailHub.API/Program.cs`
  - `src/RetailHub.API/Controllers/*.cs`
- **الخطوات:**
  1. ترقية `AppDbContext` ليرث من `IdentityDbContext<AppUser, AppRole, Guid>`.
  2. إعداد JWT Bearer Authentication في `Program.cs`.
  3. إضافة سياسات الصلاحيات (`Permissions / Roles: Admin, Cashier, InventoryManager`).
  4. وضع `[Authorize]` كإعداد افتراضي لجميع الـ Controllers.
  5. تأمين CORS: استبدال `AllowAnyOrigin()` بقائمة أصول مصرح بها من `appsettings.json`.
  6. نقل `SeedController.cs` ليصبح خدمة معزولة تعمل فقط في بيئة التطوير `app.Environment.IsDevelopment()` ومحمية بصلاحية مدير النظام.

---

### المرحلة 2: سلامة المخزون والعمليات المالية (Inventory & Finance Integrity)
> **الهدف:** القضاء التام على أخطاء البيع المزدوج، حسابات المرتجعات، وتداخل الخزائن.

#### 2.1 منع سباق البيع وتأمين كميات التشغيلات (Concurrency Control)
- **الملفات المستهدفة:**
  - `src/RetailHub.Domain/Entities/Batch.cs`
  - `src/RetailHub.Infrastructure/Persistence/Configurations/BatchConfiguration.cs`
  - `src/RetailHub.Application/Features/Invoices/Commands/CreateSaleInvoice/CreateSaleInvoiceCommandHandler.cs`
- **الخطوات:**
  1. إضافة حقل `public byte[] RowVersion { get; private set; } = [];` إلى `Batch.cs`.
  2. تكوين الحقل في `BatchConfiguration.cs` باستخدام `.IsRowVersion()`.
  3. في معالج البيع `CreateSaleInvoiceCommandHandler`: التقاط `DbUpdateConcurrencyException` وإعادة رسالة واضحة للمستخدم بأن المخزون تم تحديثه بالتزامن مع كاشير آخر ويجب إعادة محاولة الطلب.

#### 2.2 تصحيح معادلة استرداد المرتجعات (Discount-Aware Returns)
- **الملفات المستهدفة:**
  - `src/RetailHub.Application/Features/Returns/Commands/CreateReturnInvoice/CreateReturnInvoiceCommandHandler.cs`
- **الخطوات:**
  1. تعديل السطر 77: بدلاً من ضرب الكمية في `UnitPriceAtSale` الأصلي، يتم استخدام `NetUnitPrice` الفعلي الذي دفعه العميل بعد خصم الصنف.
  2. أخذ نسبة خصم رأس الفاتورة `originalInvoice.DiscountPercent` في الحسبان لضمان عدم رد مليم إضافي لم يدفعه العميل.

#### 2.3 حماية الإلغاء من تكرار الاسترجاع (Void Invoice Invariants)
- **الملفات المستهدفة:**
  - `src/RetailHub.Application/Features/Invoices/Commands/VoidInvoice/VoidInvoiceCommandHandler.cs`
  - `src/RetailHub.Application/Interfaces/Repositories/IReturnInvoiceRepository.cs`
- **الخطوات:**
  1. إضافة فحص يمنع إلغاء الفاتورة بالكامل في حال وجود مرتجعات مسجلة مسبقاً عليها (`ReturnInvoices.Any()`).
  2. توجيه المستخدم لعمل مرتجع لباقي الأصناف بدلاً من الإلغاء الشامل الذي يُنشئ بضاعة وهمية في المخزن ويعيد أموالاً زائدة من الخزينة.

#### 2.4 ربط عمليات الخزينة بالورديات ونقاط البيع (Scoped Cash Drawer)
- **الملفات المستهدفة:**
  - `src/RetailHub.Domain/Entities/CashDrawerTransaction.cs`
  - `src/RetailHub.Application/Features/Shifts/Commands/CloseShift/CloseShiftCommandHandler.cs`
  - `src/RetailHub.Application/Features/Purchases/Commands/CreatePurchaseInvoice/CreatePurchaseInvoiceCommandHandler.cs`
- **الخطوات:**
  1. إضافة `ShiftId` و `CashDrawerId` إلى كيان `CashDrawerTransaction`.
  2. تعديل إغلاق الوردية ليقوم بتجميع الحركات المرتبطة برقم الوردية الفعلي `ShiftId` فقط، وليس عبر المقارنة بالتاريخ `TransactionDate >= shift.StartTime`.
  3. في فواتير الشراء `CreatePurchaseInvoice`: إضافة خيار `PaymentMethod` (نقدي من الدرج / آجل للمورد / تحويل بنكي)، وعدم خصم المبلغ من درج الكاشير إلا إذا كان الدفع نقداً من الدرج فعلياً.

---

### المرحلة 3: أداء الاستعلامات وتوليد الفواتير (Query Performance & DB Optimization)
> **الهدف:** سرعة فائقة في الداشبورد والتقارير ومنع تعارض أرقام الفواتير.

#### 3.1 استبدال توليد الأرقام التسلسلية بـ SQL Server Sequence
- **الملفات المستهدفة:**
  - `src/RetailHub.Infrastructure/Persistence/AppDbContext.cs`
  - `src/RetailHub.Infrastructure/Persistence/Repositories/InvoiceRepository.cs`
  - `src/RetailHub.Infrastructure/Persistence/Repositories/PurchaseInvoiceRepository.cs`
- **الخطوات:**
  1. إنشاء تسلسل `Sequence` في SQL Server عبر EF Core Migration (`modelBuilder.HasSequence<int>("InvoiceSequence")`).
  2. توليد رقم الفاتورة مباشرة من السيرفر كعملية `Atomic` تمنع تصادم العمليات المتزامنة تحت أي ضغط.

#### 3.2 تصحيح استعلامات الذاكرة في الداشبورد والتقارير (OOM Prevention)
- **الملفات المستهدفة:**
  - `src/RetailHub.Application/Features/Dashboard/Queries/GetDashboardStats/GetDashboardStatsQueryHandler.cs`
  - `src/RetailHub.Application/Features/Reports/Queries/ReportQueryHandlers.cs`
- **الخطوات:**
  1. إلغاء سحب الأصناف بالكامل في الذاكرة عبر `.ToListAsync()` في الداشبورد.
  2. تنفيذ العد مباشرة عبر قاعدة البيانات:
     ```csharp
     var outOfStockCount = await _context.Products.CountAsync(p => p.Batches.Sum(b => b.Quantity) == 0, ct);
     ```
  3. تحويل حسابات تقرير الأرباح والخسائر إلى استعلامات تجميعية SQL (`GROUP BY` / `SUM`) بدلاً من تكرار الحلقات على القوائم في ذاكرة السيرفر.

#### 3.3 توحيد إدارة الأخطاء ورموز HTTP (Typed Error Results)
- **الملفات المستهدفة:**
  - `src/RetailHub.Application/Common/Result.cs`
  - `src/RetailHub.Application/Common/ErrorType.cs` (جديد)
  - `src/RetailHub.API/Common/ApiControllerBase.cs` (جديد)
- **الخطوات:**
  1. إضافة نوع الخطأ (`NotFound`, `Validation`, `Conflict`, `Forbidden`) داخل كلاس `Result`.
  2. إيقاف التحقق النصي في الـ Controllers (`result.Error.Contains("not found")`) واستبداله بـ `HandleResult()` موحد يرجع `ProblemDetails` وفق المعيار القياسي `RFC 7807`.

---

### المرحلة 4: تخصيص المستأجرين وقواعد العمل (Tenant Extensibility)
> **الهدف:** تشغيل صيدليات، محلات تجميل، ومتاجر عامة على نفس النظام.

#### 4.1 جدول إعدادات المستأجر (Tenant Configuration Engine)
- **الملفات المستهدفة:**
  - `src/RetailHub.Domain/Entities/TenantSetting.cs` (جديد)
  - `src/RetailHub.Application/Interfaces/ITenantSettingsService.cs` (جديد)
- **الخطوات:**
  1. إنشاء إعدادات مرنة تتضمن:
     - `LowStockThreshold` (الافتراضي لكل مستأجر)
     - `NearExpiryAlertDays` (أيام تنبيه الصلاحية: 30، 60، 90، إلخ)
     - `EnableExpiryTracking` (مفعل للصيدليات، معطل للملابس ومحلات التجميل العامة)
     - `EnableMultiUnitSale` (بيع بالأشرطة والأقراص)
     - `StoreReceiptHeader`, `StoreTaxNumber`, `StorePhone`, `StoreLogoUrl`
  2. حقن هذه الإعدادات كـ Cache في الذاكرة لكل مستأجر لتقليل استهلاك قاعدة البيانات.

---

### المرحلة 5: إعادة هيكلة واجهة المستخدم (Angular Clean Code & UI)
> **الهدف:** تطبيق OnPush، حل مشكلة السلة، وتفتيت المكونات الضخمة.

#### 5.1 تصحيح سلة البيع لدعم الوحدات المتعددة (Multi-Unit Cart Fix)
- **الملفات المستهدفة:**
  - `client/src/app/core/stores/cart.store.ts`
- **الخطوات:**
  1. تعديل دالة البحث داخل السلة لتبحث بالمفتاح المركب `(productId + unitId)`.
  2. تمكين الكاشير من إضافة علبة وشريط من نفس الدواء في نفس الفاتورة كسطرين منفصلين بسعر وحساب صحيحين.

#### 5.2 تفتيت المكونات الضخمة (Component Modularization)
- **الملفات المستهدفة:**
  - `client/src/app/features/products/products.component.ts` (1,305 سطر)
  - `client/src/app/features/pos/pos.component.ts` (1,013 سطر)
  - `client/src/app/features/stock-adjustments/stock-adjustments.component.ts` (492 سطر)
- **الخطوات:**
  1. استخراج المكونات التقديمية (Dumb Components):
     - `ProductTableComponent`, `ProductFilterBarComponent`, `ProductFormModalComponent`
     - `PosCartComponent`, `PosPaymentModalComponent`
  2. إنشاء مكونات عامة مشتركة في `shared/components`:
     - `<app-pagination>` الموحد لجميع الجداول.
     - `<app-date-range-filter>` الموحد لجميع الفلاتر.
  3. استبدال `setTimeout` في مربعات البحث بـ RxJS `Subject` مع `debounceTime(300)` و `distinctUntilChanged()`.

#### 5.3 تفعيل الوضع الصارم ومنع تسريب الذاكرة (Strict TS & Memory Leaks)
- **الملفات المستهدفة:**
  - `client/tsconfig.json`
  - `client/src/app/layout/main-layout/main-layout.component.ts`
  - `client/src/app/core/interceptors/tenant.interceptor.ts` (جديد)
- **الخطوات:**
  1. تفعيل `"strict": true` في `tsconfig.json` ومعالجة أي استدعاءات `any`.
  2. تنظيف الـ `setInterval` في `MainLayoutComponent` عبر `DestroyRef.onDestroy` أو إلغائه في `ngOnDestroy`.
  3. ربط جميع الـ Subscriptions بـ `takeUntilDestroyed()`.
  4. بناء `tenant.interceptor.ts` لإرسال الـ `X-Tenant-Id` header مع كل طلب HTTP تلقائياً.

---

### المرحلة 6: الاختبارات الشاملة وضمان الجودة (Quality Gates)
> **الهدف:** ضمان استقرار كل تحديث ومنع الانتكاسات البرمجية (Regression).

#### 6.1 كتابة اختبارات الوحدة والتكامل للعمليات الحرجة
- **الملفات المستهدفة:**
  - `tests/RetailHub.UnitTests/Invoices/CreateSaleInvoiceTests.cs` (جديد)
  - `tests/RetailHub.UnitTests/Invoices/StockConcurrencyTests.cs` (جديد)
  - `tests/RetailHub.UnitTests/Returns/ReturnInvoiceCalculationTests.cs` (جديد)
  - `tests/RetailHub.UnitTests/MultiTenancy/TenantIsolationTests.cs` (جديد)
- **الخطوات:**
  1. اختبار خصم الـ FEFO عبر عدة تشغيلات ذات تواريخ صلاحية مختلفة.
  2. اختبار منع بيع كميات تتجاوز الرصيد في حالات الضغط والتزامن.
  3. اختبار دقة المرتجعات المالية مع الخصومات.
  4. اختبار أن استعلام مستأجر (A) لا يمكنه قراءة بيانات مستأجر (B) تحت أي ظرف.

---

## 🚦 بروتوكول العمل المتبع
- **الالتزام بالقواعد الهندسية:** كل مرحلة ستتم عبر مهام صغيرة ومحددة (PR-sized changes).
- **الحفاظ على خضار البناء:** بعد كل تعديل، يتم التأكد من أن `dotnet build` و `ng build` واختبارات الوحدة تنجح بنسبة 100% دون أي تحذيرات أو أخطاء.
- **بدء التنفيذ:** سيبدأ التنفيذ خطوة بخطوة بعد موافقتك على هذه الخطة.
