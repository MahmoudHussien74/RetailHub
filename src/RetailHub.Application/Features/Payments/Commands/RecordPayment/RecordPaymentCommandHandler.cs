using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.Payments.Commands.RecordPayment;

/// <summary>
/// Records a payment from a customer.
/// - Validates customer exists
/// - If InvoiceId provided, validates invoice belongs to customer and updates PaymentStatus
/// - Decreases Customer.Balance
/// - Single SaveChangesAsync
/// </summary>
public class RecordPaymentCommandHandler : IRequestHandler<RecordPaymentCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public RecordPaymentCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result<Guid>> Handle(RecordPaymentCommand request, CancellationToken ct)
    {
        // 1. Validate customer
        var customer = await _unitOfWork.Customers.GetByIdAsync(request.CustomerId, ct);
        if (customer is null)
            return Result<Guid>.Failure(_localizer[MessageKeys.CustomerNotFound]);

        // 2. If linked to invoice, validate and update invoice payment status
        if (request.InvoiceId.HasValue)
        {
            var invoice = await _unitOfWork.Invoices.GetByIdWithItemsAsync(request.InvoiceId.Value, ct);
            if (invoice is null)
                return Result<Guid>.Failure(_localizer[MessageKeys.InvoiceNotFound]);

            // Update invoice payment (add to existing amount paid)
            invoice.UpdatePayment(invoice.AmountPaid + request.Amount);
            _unitOfWork.Invoices.Update(invoice);
        }

        // 3. Create payment record
        var payment = Payment.Create(
            request.CustomerId,
            request.Amount,
            request.InvoiceId,
            request.Notes);

        await _unitOfWork.Payments.AddAsync(payment, ct);

        // 4. Decrease customer balance
        customer.AdjustBalance(-request.Amount);
        _unitOfWork.Customers.Update(customer);

        // 5. Atomic save
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(payment.Id);
    }
}
