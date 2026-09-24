using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Features.Returns.DTOs;

namespace RetailHub.Application.Features.Returns.Commands.CreateReturnInvoice;

public record CreateReturnInvoiceCommand(
    Guid OriginalInvoiceId,
    List<ReturnItemRequest> Items) : IRequest<Result<Guid>>;
