using FluentValidation;
using MediatR;
using RetailHub.Application.Common;
using RetailHub.Application.Interfaces;

namespace RetailHub.Application.Features.Auth.Commands;

// ═══════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════
public record LoginCommand(string Username, string Password)
    : IRequest<Result<AuthResult>>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .WithMessage("اسم المستخدم مطلوب");
            
        RuleFor(x => x.Password)
            .NotEmpty().
            WithMessage("كلمة المرور مطلوبة");
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
    public RefreshTokenCommandValidator()
    {
        RuleFor(x => x.AccessToken)
            .NotEmpty()
            .WithMessage("Access token مطلوب");
        RuleFor(x => x.RefreshToken)
            .NotEmpty()
            .WithMessage("Refresh token مطلوب");
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

    public RegisterCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty()
            .WithMessage("الاسم الكامل مطلوب")
            .MaximumLength(100)
            .WithMessage("الاسم لا يتجاوز 100 حرف");

        RuleFor(x => x.Username).NotEmpty().WithMessage("اسم المستخدم مطلوب")
            .MinimumLength(3).WithMessage("اسم المستخدم 3 أحرف على الأقل")
            .MaximumLength(50).WithMessage("اسم المستخدم لا يتجاوز 50 حرف")
            .Matches("^[a-zA-Z0-9._]+$").WithMessage("اسم المستخدم يحتوي أحرف إنجليزية وأرقام ونقاط فقط");
        RuleFor(x => x.Password).NotEmpty().WithMessage("كلمة المرور مطلوبة")
            .MinimumLength(6).WithMessage("كلمة المرور 6 أحرف على الأقل");
        RuleFor(x => x.Role).NotEmpty().WithMessage("الدور مطلوب")
            .Must(r => AllowedRoles.Contains(r)).WithMessage("الدور يجب أن يكون Admin أو Cashier أو InventoryManager");
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
    public ChangePasswordCommandValidator()
    {
        RuleFor(x => x.CurrentPassword)
            .NotEmpty().
            WithMessage("كلمة المرور الحالية مطلوبة");

        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .WithMessage("كلمة المرور الجديدة مطلوبة")
            .MinimumLength(6)
            .WithMessage("كلمة المرور الجديدة 6 أحرف على الأقل");
    }
}

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand, Result>
{
    private readonly IAuthService _authService;
    public ChangePasswordCommandHandler(IAuthService authService) => _authService = authService;

    public Task<Result> Handle(ChangePasswordCommand request, CancellationToken ct)
        => _authService.ChangePasswordAsync(request.UserId, request.CurrentPassword, request.NewPassword, ct);
}
