using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Interfaces;
using RetailHub.Domain.Entities;

namespace RetailHub.Application.Features.CashDrawer.Commands.RecordTransaction;

public class RecordCashDrawerTransactionCommandHandler
    : IRequestHandler<RecordCashDrawerTransactionCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;

    public RecordCashDrawerTransactionCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(RecordCashDrawerTransactionCommand request, CancellationToken ct)
    {
        var transaction = CashDrawerTransaction.Create(
            request.Type,
            request.Amount,
            request.ReferenceId,
            request.Notes);

        await _unitOfWork.CashDrawerTransactions.AddAsync(transaction, ct);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result<Guid>.Success(transaction.Id);
    }
}
