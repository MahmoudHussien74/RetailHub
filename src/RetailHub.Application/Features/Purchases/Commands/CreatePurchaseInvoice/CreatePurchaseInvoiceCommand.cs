using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Purchases.DTOs;

namespace RetailHub.Application.Features.Purchases.Commands.CreatePurchaseInvoice;

public record CreatePurchaseInvoiceCommand(
    Guid SupplierId,
    DateTime PurchaseDate,
    string? Notes,
    List<PurchaseItemRequest> Items) : IRequest<Result<Guid>>;
