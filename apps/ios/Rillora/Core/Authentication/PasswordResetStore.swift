import Foundation
import Observation

@MainActor
protocol PasswordResetRequesting: AnyObject {
    var canResetPassword: Bool { get }
    func requestPasswordReset(email: String) async throws
}

/// Client-side syntax checking only. It must never become an account lookup.
enum PasswordResetEmail {
    static func normalized(_ rawValue: String) -> String? {
        let email = rawValue.trimmingCharacters(in: .whitespacesAndNewlines)
        guard email.utf8.count <= 254,
              email.range(of: #"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$"#,
                          options: .regularExpression) != nil else { return nil }
        let parts = email.split(separator: "@", omittingEmptySubsequences: false)
        guard parts.count == 2, parts[0].utf8.count <= 64,
              !parts[0].hasPrefix("."), !parts[0].hasSuffix("."), !parts[0].contains(".."),
              parts[1].split(separator: ".").allSatisfy({
                  $0.utf8.count <= 63 && !$0.hasPrefix("-") && !$0.hasSuffix("-")
              }) else { return nil }
        // Preserve user-entered casing; do not infer or substitute a profile/contact email.
        return email
    }
}

enum PasswordResetError: LocalizedError, Equatable, Sendable {
    case unavailable
    case invalidEmail
    case network
    case rateLimited
    case requestFailed

    var errorDescription: String? {
        switch self {
        case .unavailable:
            String(localized: "Password reset is unavailable in this app version.")
        case .invalidEmail:
            String(localized: "Enter a valid email address.")
        case .network:
            String(localized: "Could not reach the password reset service. Check your connection and try again.")
        case .rateLimited:
            String(localized: "Too many reset requests. Wait a few minutes before trying again.")
        case .requestFailed:
            String(localized: "The reset request could not be completed. Try again later.")
        }
    }
}

@MainActor
@Observable
final class PasswordResetStore {
    var email = ""
    private(set) var isSending = false
    private(set) var isSubmitted = false
    private(set) var errorMessage: String?

    private let service: any PasswordResetRequesting
    private var activeRequestID: UUID?

    init(service: any PasswordResetRequesting) {
        self.service = service
    }

    var isAvailable: Bool { service.canResetPassword }
    var emailIsValid: Bool { PasswordResetEmail.normalized(email) != nil }
    var canSubmit: Bool { isAvailable && emailIsValid && !isSending && !isSubmitted }

    static var confirmationMessage: String {
        String(localized: "If this email has an eligible password account, you’ll receive a reset link. Check your spam folder too.")
    }

    /// Only the explicit Send reset email button invokes this operation.
    @discardableResult
    func submit() async -> Bool {
        guard !isSending, !isSubmitted, !Task.isCancelled else { return false }
        errorMessage = nil
        guard isAvailable else {
            errorMessage = PasswordResetError.unavailable.localizedDescription
            return false
        }
        guard let normalizedEmail = PasswordResetEmail.normalized(email) else {
            errorMessage = PasswordResetError.invalidEmail.localizedDescription
            return false
        }
        let requestID = UUID()
        activeRequestID = requestID
        isSending = true
        defer {
            if activeRequestID == requestID {
                activeRequestID = nil
                isSending = false
            }
        }
        do {
            try await service.requestPasswordReset(email: normalizedEmail)
            try Task.checkCancellation()
            guard activeRequestID == requestID else { return false }
            isSubmitted = true
            email = ""
            return true
        } catch {
            guard activeRequestID == requestID else { return false }
            if Task.isCancelled || error is CancellationError { return false }
            if let urlError = error as? URLError {
                if urlError.code == .cancelled { return false }
                errorMessage = PasswordResetError.network.localizedDescription
            } else {
                // Never use localizedDescription on arbitrary provider errors.
                errorMessage = (error as? PasswordResetError ?? .requestFailed).localizedDescription
            }
            return false
        }
    }

    /// Forget form data and ignore a late result after navigation. An email request
    /// already accepted by the provider cannot be withdrawn by leaving this screen.
    func clear() {
        activeRequestID = nil
        email = ""
        isSending = false
        isSubmitted = false
        errorMessage = nil
    }
}
