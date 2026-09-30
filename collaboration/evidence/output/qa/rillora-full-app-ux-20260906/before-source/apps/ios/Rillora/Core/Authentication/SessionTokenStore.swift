import Foundation
import Security

protocol SessionTokenStore: Sendable {
    func read() async throws -> String?
    func save(_ token: String) async throws
    func delete() async throws
}

#if DEBUG
actor VolatileSessionTokenStore: SessionTokenStore {
    private var token: String?

    func read() async throws -> String? { token }
    func save(_ token: String) async throws { self.token = token }
    func delete() async throws { token = nil }
}
#endif

actor KeychainSessionTokenStore: SessionTokenStore {
    private let service: String
    private let account: String

    init(
        service: String = "com.rillora.ios.session",
        account: String = "native-bearer"
    ) {
        self.service = service
        self.account = account
    }

    func read() async throws -> String? {
        var query = baseQuery
        query[kSecReturnData as String] = true
        query[kSecMatchLimit as String] = kSecMatchLimitOne
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess,
              let data = result as? Data,
              let token = String(data: data, encoding: .utf8) else {
            throw SessionTokenStoreError.keychain(status)
        }
        return token
    }

    func save(_ token: String) async throws {
        guard let data = token.data(using: .utf8) else {
            throw SessionTokenStoreError.invalidToken
        }
        let attributes: [String: Any] = [kSecValueData as String: data]
        let updateStatus = SecItemUpdate(baseQuery as CFDictionary, attributes as CFDictionary)
        if updateStatus == errSecSuccess { return }
        guard updateStatus == errSecItemNotFound else {
            throw SessionTokenStoreError.keychain(updateStatus)
        }
        var query = baseQuery
        query[kSecValueData as String] = data
        query[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let addStatus = SecItemAdd(query as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            throw SessionTokenStoreError.keychain(addStatus)
        }
    }

    func delete() async throws {
        let status = SecItemDelete(baseQuery as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw SessionTokenStoreError.keychain(status)
        }
    }

    private var baseQuery: [String: Any] {
        [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
    }
}

enum SessionTokenStoreError: LocalizedError, Sendable {
    case invalidToken
    case keychain(OSStatus)

    var errorDescription: String? {
        switch self {
        case .invalidToken:
            "The local session could not be stored."
        case .keychain:
            "The secure session store is unavailable."
        }
    }
}
