namespace RetailHub.Application.Common.Localization;

/// <summary>
/// Centralized resource key constants for IStringLocalizer&lt;Messages&gt;.
/// Eliminates magic strings across Validators and Handlers.
/// Every key here must have a matching entry in Messages.resx and Messages.ar.resx.
/// </summary>
public static class MessageKeys
{
    // ── Validation: General ──
    public const string ValidationErrorOccurred = nameof(ValidationErrorOccurred);
    public const string RequiredField = nameof(RequiredField);
    public const string MaxLengthExceeded = nameof(MaxLengthExceeded);
    public const string MustBePositive = nameof(MustBePositive);
    public const string MustNotBeNegative = nameof(MustNotBeNegative);

    // ── Category ──
    public const string CategoryNameAr = nameof(CategoryNameAr);
    public const string CategoryNameEn = nameof(CategoryNameEn);
    public const string CategoryNotFound = nameof(CategoryNotFound);
    public const string CategoryAlreadyExists = nameof(CategoryAlreadyExists);

    // ── Brand ──
    public const string BrandNameAr = nameof(BrandNameAr);
    public const string BrandNameEn = nameof(BrandNameEn);
    public const string BrandNotFound = nameof(BrandNotFound);
    public const string BrandAlreadyExists = nameof(BrandAlreadyExists);

    // ── Product ──
    public const string ProductNameAr = nameof(ProductNameAr);
    public const string ProductNameEn = nameof(ProductNameEn);
    public const string ProductBarcode = nameof(ProductBarcode);
    public const string ProductSellingPrice = nameof(ProductSellingPrice);
    public const string ProductNotFound = nameof(ProductNotFound);
    public const string ProductBarcodeExists = nameof(ProductBarcodeExists);
    public const string ProductCategoryRequired = nameof(ProductCategoryRequired);
    public const string ProductBrandRequired = nameof(ProductBrandRequired);

    // ── Warehouse ──
    public const string WarehouseNotFound = nameof(WarehouseNotFound);
    public const string DefaultWarehouseNotFound = nameof(DefaultWarehouseNotFound);

    // ── Batch ──
    public const string BatchNotFound = nameof(BatchNotFound);
    public const string BatchQuantity = nameof(BatchQuantity);
    public const string BatchPurchasePrice = nameof(BatchPurchasePrice);
    public const string BatchExpiryDate = nameof(BatchExpiryDate);
    public const string ExpiryDateMustBeFuture = nameof(ExpiryDateMustBeFuture);

    // ── General ──
    public const string UnexpectedError = nameof(UnexpectedError);
    public const string RouteIdMismatch = nameof(RouteIdMismatch);

    // ── Invoice ──
    public const string InvoiceNotFound = nameof(InvoiceNotFound);
    public const string InvoiceAlreadyVoided = nameof(InvoiceAlreadyVoided);
    public const string InvoiceItemsRequired = nameof(InvoiceItemsRequired);
    public const string InvoiceAmountPaid = nameof(InvoiceAmountPaid);
    public const string InsufficientStock = nameof(InsufficientStock);
    public const string InvoiceQuantity = nameof(InvoiceQuantity);
    public const string InvoiceProductId = nameof(InvoiceProductId);
    // ── Customer ──
    public const string CustomerName = nameof(CustomerName);
    public const string CustomerPhone = nameof(CustomerPhone);
    public const string CustomerNotFound = nameof(CustomerNotFound);
    public const string CustomerPhoneExists = nameof(CustomerPhoneExists);

    // ── Payment ──
    public const string PaymentAmount = nameof(PaymentAmount);

    // ── Supplier ──
    public const string SupplierName = nameof(SupplierName);
    public const string SupplierNotFound = nameof(SupplierNotFound);
    public const string SupplierAlreadyExists = nameof(SupplierAlreadyExists);

    // ── Purchase Invoice ──
    public const string PurchaseInvoiceNotFound = nameof(PurchaseInvoiceNotFound);
    public const string PurchaseItemsRequired = nameof(PurchaseItemsRequired);

    // ── Return Invoice ──
    public const string ReturnInvoiceNotFound = nameof(ReturnInvoiceNotFound);
    public const string ReturnInvoiceItemNotFound = nameof(ReturnInvoiceItemNotFound);
    public const string ReturnOriginalInvoice = nameof(ReturnOriginalInvoice);
    public const string ReturnItemsRequired = nameof(ReturnItemsRequired);
    public const string ReturnInvoiceItemId = nameof(ReturnInvoiceItemId);
    public const string ReturnQuantity = nameof(ReturnQuantity);
    public const string ReturnQuantityExceeded = nameof(ReturnQuantityExceeded);
}
