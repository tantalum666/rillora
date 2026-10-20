import Foundation

enum RilloraAPIError: LocalizedError, Equatable, Sendable {
    case invalidResponse
    case requestFailed(String)
    case server(status: Int, code: String, message: String, requestID: String?)
    case invalidPayload(String)

    var errorDescription: String? {
        switch self {
        case .invalidResponse:
            String(localized: "The continuity service returned an invalid response.")
        case .requestFailed(let message):
            message
        case .server(let status, let code, let message, _):
            L10n.serverError(status: status, code: code, message: message)
        case .invalidPayload:
            String(localized: "The continuity service returned data this version cannot read.")
        }
    }

    var isAuthenticationRequired: Bool {
        guard case .server(let status, let code, _, _) = self else { return false }
        return status == 401 || code == "authentication_required"
    }

    var isReauthenticationRequired: Bool {
        guard case .server(let status, let code, _, _) = self else { return false }
        return status == 403 && code == "reauthentication_required"
    }

    var isVersionConflict: Bool {
        guard case .server(let status, let code, _, _) = self else { return false }
        return status == 409 && code == "version_conflict"
    }
}
