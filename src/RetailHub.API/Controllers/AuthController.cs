using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RetailHub.API.Common;
using RetailHub.Application.Features.Auth.Commands;
using RetailHub.Application.Interfaces;

namespace RetailHub.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;
    public AuthController(IMediator mediator) => _mediator = mediator;

    /// <summary>
    /// تسجيل الدخول باسم المستخدم وكلمة المرور.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsFailure)
            return Unauthorized(new ApiResponse<object> { Success = false, Message = result.Error });

        return Ok(new ApiResponse<object> { Success = true, Data = result.Value });
    }

    /// <summary>
    /// تجديد الـ Access Token باستخدام Refresh Token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsFailure)
            return Unauthorized(new ApiResponse<object> { Success = false, Message = result.Error });

        return Ok(new ApiResponse<object> { Success = true, Data = result.Value });
    }

    /// <summary>
    /// إنشاء مستخدم جديد (Admin فقط).
    /// </summary>
    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterCommand command)
    {
        var result = await _mediator.Send(command);
        if (result.IsFailure)
            return BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });

        return Ok(new ApiResponse<Guid> { Success = true, Data = result.Value! });
    }

    /// <summary>
    /// تغيير كلمة المرور للمستخدم الحالي.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordCommand command)
    {
        var currentUser = HttpContext.RequestServices.GetRequiredService<ICurrentUser>();
        var cmd = command with { UserId = currentUser.UserId };

        var result = await _mediator.Send(cmd);
        if (result.IsFailure)
            return BadRequest(new ApiResponse<object> { Success = false, Message = result.Error });

        return Ok(new ApiResponse<object> { Success = true, Message = "تم تغيير كلمة المرور بنجاح" });
    }

    /// <summary>
    /// جلب بيانات المستخدم الحالي من الـ Token.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        var currentUser = HttpContext.RequestServices.GetRequiredService<ICurrentUser>();
        return Ok(new ApiResponse<object>
        {
            Success = true,
            Data = new
            {
                id = currentUser.UserId,
                username = currentUser.Username,
                role = currentUser.Role
            }
        });
    }
}
