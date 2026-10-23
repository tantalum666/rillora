import Foundation

enum ContentText {
    static var chinese: Bool { Bundle.module.preferredLocalizations.first?.hasPrefix("zh") == true }
    static func get(_ key: String) -> String { Bundle.module.localizedString(forKey: key, value: key, table: "Localizable") }
    static func error(_ error: Error) -> String {
        guard let error = error as? ContentError else { return get("failed") }
        switch error {
        case .invalidResponse: return get("invalidResponse")
        case .invalidInput: return get("invalidInput")
        case .tooLarge: return get("tooLarge")
        case .unsupportedFile: return get("unsupportedFile")
        case .cycle: return get("cycle")
        case .accountChanged, .authentication: return get("authentication")
        case .microphone: return get("microphoneDenied")
        case .speechUnavailable: return get("speechUnavailable")
        case .unavailable: return get("failed")
        case .server(let code):
            switch code {
            case "legacy_content_changed", "legacy_changed", "version_conflict": return get("conflict")
            case "legacy_prerequisites": return get("prerequisitesPending")
            case "legacy_content_notice_required", "legacy_notice_required": return get("noticeRequired")
            case "legacy_future_private": return get("futureBoundary")
            case "legacy_private_matter": return get("privateMatter")
            case "legacy_contact_unavailable": return get("contactUnavailable")
            case "legacy_storage_limit", "legacy_pack_limit": return get("allowance")
            case "legacy_content_family_required", "legacy_family_required": return get("familyRequired")
            case "legacy_upload_busy": return get("uploadBusy")
            case "legacy_content_too_large": return get("tooLarge")
            case "legacy_content_missing", "legacy_not_found", "legacy_unavailable", "not_found": return get("unavailable")
            case "legacy_read_only": return get("writesClosed")
            case "reauthentication_required": return get("recentAuthentication")
            default: return get("failed")
            }
        }
    }
}
