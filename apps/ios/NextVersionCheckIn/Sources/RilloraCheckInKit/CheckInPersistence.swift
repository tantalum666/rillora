import Foundation
#if canImport(Security)
import Security
#endif

@MainActor
protocol CheckInPersistence: AnyObject {
    func load() throws -> Data?
    func save(_ data: Data?) throws
}

@MainActor
final class MemoryCheckInPersistence: CheckInPersistence {
    var data: Data?
    func load() throws -> Data? { data }
    func save(_ data: Data?) throws { self.data = data }
}

#if os(iOS) || os(watchOS)
@MainActor
final class KeychainCheckInPersistence: CheckInPersistence {
    private let item: String
    init(item: String) { self.item = item }
    private var query: [String: Any] {
        [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: "com.rillora.next.checkin",
         kSecAttrAccount as String: item, kSecAttrSynchronizable as String: false]
    }
    func load() throws -> Data? {
        var query = query; query[kSecReturnData as String] = true; query[kSecMatchLimit as String] = kSecMatchLimitOne
        var value: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &value)
        CheckInDebug.status("keychain.read", Int(status))
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = value as? Data, data.count <= CheckInWire.limit else { throw CheckInFailure.storage }
        return data
    }
    func save(_ data: Data?) throws {
        guard let data else {
            let status = SecItemDelete(query as CFDictionary)
            guard status == errSecSuccess || status == errSecItemNotFound else { throw CheckInFailure.storage }; return
        }
        guard data.count <= CheckInWire.limit else { throw CheckInFailure.storage }
        let update = SecItemUpdate(query as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if update == errSecSuccess { return }
        guard update == errSecItemNotFound else { throw CheckInFailure.storage }
        var attributes = query; attributes[kSecValueData as String] = data
        attributes[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let added = SecItemAdd(attributes as CFDictionary, nil)
        CheckInDebug.status("keychain.add", Int(added))
        guard added == errSecSuccess else { throw CheckInFailure.storage }
    }
}
#endif
