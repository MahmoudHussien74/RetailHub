using FluentValidation;
using MediatR;
using Microsoft.Extensions.Localization;
using RetailHub.Application.Common;
using RetailHub.Application.Common.Localization;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Auth.Commands;

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
public record LoginCommand(string Username, string Password)
    : IRequest<Result<AuthResult>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.Username]));
            
        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.Password]));
    }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, Result<AuthResult>>
{
    private readonly IAuthService _authService;
    public LoginCommandHandler(IAuthService authService) => _authService = authService;

    public Task<Result<AuthResult>> Handle(LoginCommand request, CancellationToken ct)
        => _authService.LoginAsync(request.Username, request.Password, ct);
}

// ═══════════════════════════════════════════════════════════════
// REFRESH TOKEN
// ═══════════════════════════════════════════════════════════════
public record RefreshTokenCommand(string AccessToken, string RefreshToken)
    : IRequest<Result<AuthResult>>;

public class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.AccessToken)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.AccessToken]));

        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.RefreshToken]));
    }
}

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, Result<AuthResult>>
{
    private readonly IAuthService _authService;
    public RefreshTokenCommandHandler(IAuthService authService) => _authService = authService;

    public Task<Result<AuthResult>> Handle(RefreshTokenCommand request, CancellationToken ct)
        => _authService.RefreshTokenAsync(request.AccessToken, request.RefreshToken, ct);
}

// ═══════════════════════════════════════════════════════════════
// REGISTER (Admin only)
// ═══════════════════════════════════════════════════════════════
public record RegisterCommand(string FullName, string Username, string Password, string Role)
    : IRequest<Result<Guid>>;

public class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    private static readonly string[] AllowedRoles = ["Admin", "Cashier", "InventoryManager"];

    public RegisterCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.FullName]))
            .MaximumLength(100)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MaxLengthExceeded],
                localizer[MessageKeys.FullName], 100));

        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.Username]))
            .MinimumLength(3)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.FieldMinLength],
                localizer[MessageKeys.Username], 3))
            .MaximumLength(50)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.MaxLengthExceeded],
                localizer[MessageKeys.Username], 50))
            .Matches("^[a-zA-Z0-9._]+$")
            .WithMessage(_ => localizer[MessageKeys.UsernameFormatInvalid].Value);

        RuleFor(x => x.Password)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.Password]))
            .MinimumLength(6)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.FieldMinLength],
                localizer[MessageKeys.Password], 6));

        RuleFor(x => x.Role)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.Role]))
            .Must(r => AllowedRoles.Contains(r))
            .WithMessage(_ => localizer[MessageKeys.RoleInvalid].Value);
    }
}

public class RegisterCommandHandler : IRequestHandler<RegisterCommand, Result<Guid>>
{
    private readonly IAuthService _authService;
    public RegisterCommandHandler(IAuthService authService) => _authService = authService;

    public Task<Result<Guid>> Handle(RegisterCommand request, CancellationToken ct)
        => _authService.RegisterAsync(request.FullName, request.Username, request.Password, request.Role, ct);
}

// ═══════════════════════════════════════════════════════════════
// CHANGE PASSWORD
// ═══════════════════════════════════════════════════════════════
public record ChangePasswordCommand(string CurrentPassword, string NewPassword)
    : IRequest<Result>
{
    /// <summary>Set by the controller from the authenticated user's claims.</summary>
    public Guid UserId { get; init; }
}

public class ChangePasswordCommandValidator : AbstractValidator<ChangePasswordCommand>
{
    public ChangePasswordCommandValidator(IStringLocalizer<Messages> localizer)
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.CurrentPassword]));

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.RequiredField],
                localizer[MessageKeys.NewPassword]))
            .MinimumLength(6)
            .WithMessage(_ => string.Format(
                localizer[MessageKeys.FieldMinLength],
                localizer[MessageKeys.NewPassword], 6));
    }
}

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result>
{
    private readonly IAuthService _authService;
    public ChangePasswordCommandHandler(IAuthService authService) => _authService = authService;

    public Task<Result> Handle(ChangePasswordCommand request, CancellationToken ct)
        => _authService.ChangePasswordAsync(request.UserId, request.CurrentPassword, request.NewPassword, ct);
}
