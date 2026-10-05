import Foundation

/// Presentation-only localization. Never pass saved content, API enums, identifiers,
/// URLs, security material or server-provided text as a localization key.
/// The operating system owns the persisted per-app language preference.
enum L10n {
    /// Catalog-backed format strings use numbered placeholders so translators can
    /// reorder arguments. The region remains the user's region; no currency conversion.
    static func format(_ key: String, _ arguments: CVarArg...) -> String {
        format(key, arguments: arguments, bundle: .main, locale: .autoupdatingCurrent)
    }

    static func format(
        _ key: String,
        arguments: [CVarArg],
        bundle: Bundle,
        locale: Locale
    ) -> String {
        let template = bundle.localizedString(forKey: key, value: key, table: "Localizable")
        return String(format: template, locale: locale, arguments: arguments)
    }

    static var languageName: String {
        isSimplifiedChinese(bundle: .main) ? "简体中文" : "English"
    }

    static func isSimplifiedChinese(bundle: Bundle) -> Bool {
        // Explicit resource sub-bundles are used by deterministic localization tests.
        let language = bundle.bundleURL.pathExtension == "lproj"
            ? bundle.bundleURL.deletingPathExtension().lastPathComponent
            : bundle.preferredLocalizations.first ?? "en"
        return language.hasPrefix("zh")
    }

    /// English keeps the existing server explanation; Chinese maps only trusted
    /// machine codes and falls back safely, never using arbitrary text as a key.
    static func serverError(status: Int, code: String, message: String, bundle: Bundle = .main) -> String {
        guard isSimplifiedChinese(bundle: bundle) else { return message }
        let key: String
        switch code {
        case "authentication_required": key = "Authentication is required."
        case "reauthentication_required": key = "Sign in again to continue this sensitive action."
        case "account_changed": key = "Your account changed. Sign in again to reload your map."
        case "invalid_session": key = "Your session expired. Sign in again."
        case "invalid_pagination": key = "Your map could not be loaded completely. Please retry."
        case "version_conflict": key = "The record changed. Refresh and try again."
        case "saved_draft_changed": key = "This draft changed. Review the latest version before saving."
        case "service_not_open": key = "Accounts are not open yet. You can still explore Rillora and its guides."
        case "verified_email_required": key = "Verify your email before continuing."
        case "billing_confirmation_required": key = "Review and confirm the current billing information before continuing."
        case "temporarily_unavailable": key = "This service is temporarily unavailable. Please try again later."
        default:
            if status == 429 { key = "Too many requests. Please wait a moment and try again." }
            else if status == 401 { key = "Authentication is required." }
            else { key = "The continuity service could not complete the request." }
        }
        return bundle.localizedString(forKey: key, value: key, table: "Localizable")
    }
}
