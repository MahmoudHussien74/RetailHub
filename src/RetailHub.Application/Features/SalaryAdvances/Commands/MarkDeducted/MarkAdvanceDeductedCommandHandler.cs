using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.SalaryAdvances.Commands.MarkDeducted;

public class MarkAdvanceDeductedCommandHandler : IRequestHandler<MarkAdvanceDeductedCommand, Result>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStringLocalizer<Messages> _localizer;

    public MarkAdvanceDeductedCommandHandler(IUnitOfWork unitOfWork, IStringLocalizer<Messages> localizer)
    {
        _unitOfWork = unitOfWork;
        _localizer = localizer;
    }

    public async Task<Result> Handle(MarkAdvanceDeductedCommand request, CancellationToken ct)
    {
        var advance = await _unitOfWork.SalaryAdvances.GetByIdAsync(request.AdvanceId, ct);

        if (advance is null)
            return Result.Failure(_localizer[MessageKeys.AdvanceNotFound]);

        advance.MarkDeducted();
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}
