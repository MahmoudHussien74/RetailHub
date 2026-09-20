# Project Architecture & Coding Rules
### Cosmetics Store Management System — AI Coding Assistant Instructions

---

## 1. Clean Architecture — Layer Boundaries (Non-negotiable)

```
API  →  Application  →  Domain
              ↑
        Infrastructure
```

### Strict Rules:
- **Domain layer**: No reference to EF Core, MediatR, ASP.NET, or any external library. Entities, Value Objects, and core Business Rules only.
- **Application layer**: Knows Domain only. Contains Commands/Queries/Handlers/Interfaces (`IProductRepository`, `IUnitOfWork`). No EF Core knowledge — only Interface definitions.
- **Infrastructure layer**: Knows Application and Domain. Contains EF Core, DbContext, actual Repositories, External services.
- **API layer** (Controllers): Knows Application only. Controllers must only use `IMediator.Send()` — no direct `DbContext` or Repository injection.

### Forbidden:
- Controller calling `DbContext` directly.
- Domain entity with `[Column]` or any EF Core attribute — all configuration via `IEntityTypeConfiguration<T>` in Infrastructure.
- `using Microsoft.EntityFrameworkCore;` in Application layer.
- Business Rules (Weighted Average, FEFO logic) inside Controller or Infrastructure — must be in Domain or Application Handler.

---

## 2. CQRS + MediatR Conventions

- Each Command/Query has a separate Handler in a separate file.
- Naming: `CreateSaleCommand` + `CreateSaleCommandHandler`.
- **Commands** return operation result only (Success/Failure or Id), not full data.
- **Queries** are Read-only — any Query modifying data = design error.
- Each Command must have a separate `Validator` (FluentValidation).
- Complex Business Logic (FEFO, Weighted Average, Cash Drawer posting) executes inside Command Handler or Domain Service.

---

## 3. EF Core Performance Rules (Mandatory)

- **Projection over Include** for Queries (Read side) — use `.Select()` or `.ProjectToType<TDto>()`.
- **`AsNoTracking()` mandatory** on any read-only Query.
- **Exception for Include**: Write-side Command handlers that need full Entity for modification.
- **Pagination mandatory** on any Query returning potentially large result sets. No `ToListAsync()` without `Skip/Take` on growing tables.
- **No N+1**: No `foreach` with DB calls inside. Collect IDs first, then single query with `Where(x => ids.Contains(x.Id))`.

---

## 4. Magic Strings — Forbidden

- All status/type/role values must be **Enum or Constant**, never raw strings.
- Config keys: use `nameof()` or Options pattern.
- Claim types / Policy names: `static class` with `const string`.
- Repeated route templates: centralized constants.

---

## 5. Repository & Unit of Work

- **No Generic Repository** for all Entities. Each Aggregate has a specific Repository with domain-relevant methods.
- **Single Unit of Work** exposing one `SaveChangesAsync()`. Multi-repository operations save once at Handler end.
- Repository Interfaces in **Application layer**, Implementations in **Infrastructure**.

---

## 5.1 Mapster (Mapping)

- Use `ProjectToType<TDto>()` in Query Handlers (translates to SQL SELECT with required columns only).
- Complex mappings in centralized `IRegister` Config, not scattered in Handlers.
- **Mapping Configs location: Application layer** (alongside DTOs).
- Primary use on **Query side (Read)**. Commands return `Result<Guid>` or simple results.

---

## 5.2 FluentValidation

- Each Command has a `Validator`: `CreateSaleCommand` → `CreateSaleCommandValidator`.
- **No validation logic inside Handlers** — input format validation belongs in Validator.
- **Business Rule failures** (e.g., "quantity exceeds stock") return `Result.Failure(...)` from Handler, not Validator.
- Validators auto-registered via Assembly scanning (MediatR Pipeline Behavior).

---

## 6. Result Pattern + Global Exception Handler

| | Result Pattern | Global Exception Handler |
|---|---|---|
| Handles | **Expected** errors (Business failures) | **Unexpected** errors (real Exceptions) |
| Example | Quantity unavailable, Invoice not found | DB connection down, Null reference bug |
| Throws Exception? | No | Yes |

- Business failures → `Result<T>.Failure(...)`, never `throw new Exception(...)`.
- Unexpected errors → caught by Global Exception Handler Middleware, logged by Serilog, returns uniform response.
- Controller converts `Result.IsSuccess` to `Ok()`/`BadRequest()` — no `try/catch` in Controllers.

---

## 7. General Rules

- **`decimal` for money**, never `float`/`double`.
- **Idempotency** on sale operations via `IdempotencyKey` (GUID).
- **No Hard Delete** on financial records — use `IsVoided = true` or Reversal entry.
- **All dates stored UTC** (`DateTime.UtcNow`), local conversion at display time only.
- **Required Indexes**: `Product.Barcode` (Unique), `Batch.ExpiryDate`, `Invoice.CreatedAt`, `Invoice.CustomerId`.
- **No secrets in Git** — User Secrets for dev, Azure Key Vault for deployment.

---

## 8. Git / GitHub Workflow

- **One Commit = One small, complete, logically related Task**.
- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`.
- **Feature branches**: `feature/product-and-batch-domain`, `feature/sales-fefo-logic`.
- **No real secrets** in `appsettings.json` — `.gitignore` includes `appsettings.Development.json` and `appsettings.Production.json`.
- **Incremental README updates** with each Phase.
- **Tags per Phase**: `v0.1-core-domain`, `v0.2-sales-module`.

---

## 9. AI Self-Check Before Any Solution

1. Does this solution make Domain aware of Infrastructure or vice versa? → Reject.
2. Does this Query return more data than needed? → Use Projection.
3. Is this Query read-only? → Add `AsNoTracking()`.
4. Is there a repeated string or number representing a state/type? → Convert to Enum/Constant.
5. Is this Business Logic in the right place (Domain/Application)? → Move it if not.
6. Is this a logical, expected failure throwing an Exception? → Convert to `Result.Failure(...)`.
7. Did this bypass Repository, or make separate SaveChanges for operations that should be in the same Transaction? → Fix it.
