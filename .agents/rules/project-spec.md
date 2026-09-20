# Project Specification — Retail & Inventory Management System
### (First Client: Cosmetics Store — Long-term Goal: SaaS Retail Core)

---

## 1. Project Overview

Retail Management System serving a **cosmetics store** as first client, designed as an **extensible core** for future verticals (pharmacies, supermarkets) and potential **SaaS** conversion.

**Key Architectural Decision:** First version is **Single-tenant**. No Multi-tenancy now, but all code written so adding `TenantId` later won't break anything (via Repository Pattern).

---

## 2. Domain — What the System Manages

### 2.1 Products & Inventory
- `Product` identified by **unique Barcode**, has name, category, and current `SellingPrice`.
- Product has **no fixed quantity on itself** — quantity distributed across **Batches**.
- Each `Batch` = separate purchase lot with: remaining quantity, `PurchasePrice` for that lot, `ExpiryDate`.

### 2.2 Costing — Weighted Average Cost
- `Product.AverageCost` = weighted average cost of all currently available quantities.
- Formula: `AverageCost = Total cost of all available Batches ÷ Total available quantity`.
- **Auto-updated with every new Batch**, within the **same Database Transaction**.

### 2.3 Sales — FEFO (First Expired, First Out)
- System **automatically decides** which Batch to deduct from (not cashier/customer).
- Rule: Sort available Batches by `ExpiryDate` ascending, deduct from earliest first. If quantity needed > single Batch, continue to next.
- **Mandatory Snapshot at sale time:** `InvoiceItem` stores `UnitPriceAtSale` and `UnitCostAtSale` — **not** a reference to current product price.
- **Single cashier only** in this version — no complex Concurrency handling needed.

### 2.4 Returns
- **Sellable product** → returns to available stock.
- **Damaged product** → recorded as damage, doesn't return to sellable stock.
- **Partial returns** allowed.
- Prevent returning same quantity twice; validate against original invoice.
- Credit invoice returns must adjust `Customer.Balance`.

### 2.5 Purchases & Suppliers
- `Supplier` linked to Purchase Invoice, each Purchase Invoice creates new Batch(es).

### 2.6 Customers & Credit Sales
- `Customer` with `Balance` (credit balance).
- `Invoice.PaymentStatus`: **Paid** / **Partial** / **Credit**.
- `Payment` — independent record tracking customer installment payments.

### 2.7 Cash Drawer
- Goal: Expected system balance at end of day = actual cash in drawer.
- Every cash movement recorded as single line in unified `CashDrawerTransaction` table.
- Daily `OpeningBalance` and auto-calculated `ClosingBalance`.
- **Card/electronic payments don't affect cash drawer balance** — only total sales.

### 2.8 Employees & Advances
- `Employee` with `BaseSalary`.
- `SalaryAdvance` — deducted from salary later.
- If advance taken from drawer, must also record `CashDrawerTransaction`.
- Salary changes don't affect historical month calculations (snapshot per month).

---

## 3. Business Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| Costing Policy | **Weighted Average** | More accurate profit than Latest Cost, simpler than FIFO |
| Warehouses | **Single warehouse** | But `Warehouse` table designed for future expansion |
| Batches/Expiry | **From version 1** | Hard to retrofit later without major refactor |
| Credit Sales | **Required** | Client actually needs it |
| Cashier Count | **One only** | Complex concurrency deferred |
| Cash Drawer | **Unified Ledger** | Match expected vs actual cash at end of day |
| Multi-tenancy | **Deferred** | But design allows adding it later without breaking |

---

## 4. Domain Model

```
Product
 ├── Id, Barcode (Unique), Name, CategoryId, BrandId
 ├── SellingPrice
 └── AverageCost (calculated, updated with each new Batch)

Warehouse
 └── Id, Name   (single row now, table exists for expansion)

Batch
 ├── Id, ProductId, WarehouseId
 ├── PurchasePrice, Quantity, ExpiryDate
 └── SupplierId (optional)

StockMovement
 ├── Id, ProductId, BatchId
 ├── Type (Purchase / Sale / Return / Damage / Adjustment)
 ├── Quantity, Date
 └── ReferenceId

Customer
 ├── Id, Name, Phone
 └── Balance

Invoice
 ├── Id, CustomerId (nullable for cash sales)
 ├── PaymentStatus (Paid / Partial / Credit)
 ├── TotalAmount, AmountPaid
 └── InvoiceItems[]
      ├── ProductId, BatchId, Quantity
      ├── UnitPriceAtSale, UnitCostAtSale   ← Snapshot at sale time

Payment
 ├── Id, InvoiceId or CustomerId
 └── Amount, Date

Supplier
 └── Id, Name, Phone

PurchaseInvoice
 ├── Id, SupplierId, Date
 └── Items[] → create new Batches

Employee
 ├── Id, Name, BaseSalary, Role

SalaryAdvance
 ├── Id, EmployeeId, Amount, Date, Status (Pending/Deducted)

CashDrawerTransaction
 ├── Id, Date, Type (Sale/Return/SalaryAdvance/Expense)
 ├── Amount (positive/negative)
 └── ReferenceId

User (Auth)
 ├── Id, Username, PasswordHash
 └── Role (Admin / Cashier / Manager)
```

---

## 5. Core Business Rules

1. **Adding new Batch = update `Product.AverageCost` in same Transaction.**
2. **Sales deduct from Batches ordered by nearest `ExpiryDate` (FEFO), automatically.**
3. **`InvoiceItem` stores `UnitPriceAtSale` and `UnitCostAtSale` at creation — immutable forever.**
4. **Sale = single Transaction:** Stock deduction + Invoice creation + (if cash) CashDrawerTransaction — all or nothing.
5. **No Hard Delete on financial records** — use `IsVoided`/Reversal entry.
6. **Every actual cash movement must have a `CashDrawerTransaction` line.** Card payments excluded.
7. **Damaged returns don't return to sellable Batch.**
8. **Price/salary changes don't affect historical records.**

---

## 6. Implementation Phases

| Phase | Content | Est. Duration |
|---|---|---|
| **0** | Business Decisions (Done ✅) | — |
| **1** | Core Domain: `Product`, `Warehouse`, `Batch`, `StockMovement`, `AverageCost` logic | 2-3 weeks |
| **2** | Sales: Cart→Invoice, FEFO logic, Price Snapshots, `PaymentStatus` | 2 weeks |
| **3** | Customers/Credit + Returns + Purchases/Suppliers | 2 weeks |
| **4** | Cash Drawer Ledger + Employees/Salary Advances | 1.5 weeks |
| **5** | Auth (JWT + Roles) + Audit Logging + Reporting | 1.5 weeks |
| **6** | Docker + Deployment + Swagger/Postman | 1 week |

**Total estimate:** 9-10 weeks.
