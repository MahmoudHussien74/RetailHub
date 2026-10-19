using System.Globalization;

namespace RetailHub.Application.Common.Errors;

/// <summary>
/// Represents an application error with localized messages (Arabic and English).
/// Evaluates <see cref="Description"/> dynamically based on <see cref="CultureInfo.CurrentUICulture"/>.
/// </summary>
public record Error(string Code, string DescriptionAr, string DescriptionEn)
{
    public static readonly Error None = new(string.Empty, string.Empty, string.Empty);

    public string Description =>
        CultureInfo.CurrentUICulture.TwoLetterISOLanguageName.Equals("en", StringComparison.OrdinalIgnoreCase)
            ? DescriptionEn
            : DescriptionAr;

    public override string ToString() => Description;

    public static implicit operator string(Error error) => error.Description;
}
