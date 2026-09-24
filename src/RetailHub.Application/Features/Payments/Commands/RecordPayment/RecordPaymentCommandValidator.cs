using FluentValidation;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common.Localization;

namespace RetailHub.Application.Features.Payments.Commands.RecordPayment;

public class RecordPaymentCommandValidator : AbstractValidator<RecordPaymentCommand>
{
    public RecordPaymentCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.CustomerName]));

        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MustBePositive],
                localizer[MessageKeys.PaymentAmount]));
    }
}
