import CryptoKit
import Foundation

enum SessionStorageNamespace {
    enum Purpose: String { case session; case deletionReference = "deletion-reference" }

    static func service(for baseURL: URL?, purpose: Purpose) -> String {
        let legacy = "com.rillora.ios.\(purpose.rawValue)"
        guard let baseURL else { return legacy + ".unconfigured" }
        let endpoint = baseURL.absoluteString.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        // Preserve the currently installed staging session without copying it
        // into production. Other origins receive independent keychain services.
        if endpoint == "https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com/v1" { return legacy }
        let digest = SHA256.hash(data: Data(endpoint.utf8))
            .map { String(format: "%02x", $0) }.joined()
        return legacy + "." + digest
    }
}
