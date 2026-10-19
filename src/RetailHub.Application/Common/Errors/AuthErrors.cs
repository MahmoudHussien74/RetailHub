namespace RetailHub.Application.Common.Errors;

/// <summary>
/// Static class defining authentication and user identity errors.
/// Replaces magic strings and provides localized Arabic and English error messages.
/// </summary>
public static class AuthErrors
{
    public static readonly Error UserNotFound = new(
        "Auth.UserNotFound",
        "المستخدم غير موجود.",
        "User not found.");

    public static readonly Error InvalidCredentials = new(
        "Auth.InvalidCredentials",
        "اسم المستخدم أو كلمة المرور غير صحيحة.",
        "Invalid username or password.");

    public static readonly Error InvalidAccessToken = new(
        "Auth.InvalidAccessToken",
        "رمز الوصول (Access token) غير صالح.",
        "Invalid access token.");

    public static readonly Error UserNotFoundOrInactive = new(
        "Auth.UserNotFoundOrInactive",
        "المستخدم غير موجود أو معطل.",
        "User not found or inactive.");

    public static readonly Error InvalidRefreshToken = new(
        "Auth.InvalidRefreshToken",
        "رمز التحديث (Refresh token) غير صالح أو منتهي الصلاحية.",
        "Invalid or expired refresh token.");

    public static readonly Error UsernameAlreadyExists = new(
        "Auth.UsernameAlreadyExists",
        "اسم المستخدم مستخدم بالفعل.",
        "Username is already taken.");
}
