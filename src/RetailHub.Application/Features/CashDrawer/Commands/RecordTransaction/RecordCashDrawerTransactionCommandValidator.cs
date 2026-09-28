using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.CashDrawer.Commands.RecordTransaction;

public class RecordCashDrawerTransactionCommandValidator
    : AbstractValidator<RecordCashDrawerTransactionCommand>
{
    public RecordCashDrawerTransactionCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage(_ => string.Format(localizer[MessageKeys.RequiredField], localizer[MessageKeys.CashDrawerTransactionType]));

        RuleFor(x => x.Amount)
            .NotEqual(0)
            .WithMessage(_ => localizer[MessageKeys.CashDrawerAmountNonZero]);
    }
}
