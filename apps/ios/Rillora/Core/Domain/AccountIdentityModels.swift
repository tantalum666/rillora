import Foundation

/// Read-only identity of the server-selected active account. Email is transient;
/// this response never contains the issuer subject, credentials or factor state.
protocol AccountIdentityServing: Sendable {
    func fetchAccountIdentity() async throws -> AccountIdentityResponse
}

struct AccountIdentityResponse: Decodable, Equatable, Sendable {
    struct Account: Decodable, Equatable, Sendable {
        let publicId: String
        let displayName: String
        let verifiedEmail: String?
    }

    enum EmailStatus: String, Decodable, Equatable, Sendable {
        case available
        case notProvided = "not_provided"
        case unavailable
    }

    let account: Account
    let emailStatus: EmailStatus

    var displayedEmail: String? {
        guard emailStatus == .available,
              let value = account.verifiedEmail?.trimmingCharacters(in: .whitespacesAndNewlines),
              !value.isEmpty else { return nil }
        return value
    }

    func belongs(to plannerPublicID: String) -> Bool {
        guard let expected = UUID(uuidString: plannerPublicID),
              let actual = UUID(uuidString: account.publicId) else { return false }
        return expected == actual
    }
}
