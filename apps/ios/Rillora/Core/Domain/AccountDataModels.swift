import Foundation
import Security

protocol AccountDataServing: Sendable {
    func fetchAccountDataProfile() async throws -> AccountDataProfile
    func exportMapBackup() async throws -> Data
    func importMapBackup(_ data: Data) async throws -> MapImportResult
    func fetchArchivedMatters() async throws -> [Matter]
    func restoreArchivedMatter(id: String, version: Int) async throws -> Matter
    func requestAccountDeletion(receipt: String, acknowledgesBilling: Bool) async throws -> AccountDeletionEnvelope
    func accountDeletionStatus(receipt: String) async throws -> AccountDeletionEnvelope
}

struct AccountDeletionEnvelope: Decodable, Sendable {
    struct Status: Decodable, Sendable { let publicId: String; let status: String; let requestedAt: String; let completedAt: String? }
    let deletion: Status
}
struct AccountDeletionReference: Codable, Sendable, Identifiable {
    var schemaVersion = "rillora-deletion-reference-v1"
    let receipt: String
    let createdAt: Double
    var id: String { receipt }
    var isValid: Bool { schemaVersion == "rillora-deletion-reference-v1" && receipt.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil && createdAt.isFinite }
    static func create() throws -> Self {
        var bytes = [UInt8](repeating: 0, count: 32)
        guard SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes) == errSecSuccess else { throw RilloraAPIError.invalidResponse }
        return Self(receipt: Data(bytes).base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: ""), createdAt: Date().timeIntervalSince1970 * 1000)
    }
}

@MainActor
enum AccountDeletionReferenceStore {
    private static let keychain = KeychainSessionTokenStore(
        service: SessionStorageNamespace.service(for: try? APIConfiguration.current().baseURL, purpose: .deletionReference),
        account: "latest"
    )
    #if DEBUG
    private static let volatile = VolatileSessionTokenStore()
    #endif
    private static var store: any SessionTokenStore {
        #if DEBUG
        if ProcessInfo.processInfo.environment["RILLORA_UI_TEST_FORCE_SIGNED_OUT"] == "1" { return volatile }
        #endif
        return keychain
    }
    static func save(_ reference: AccountDeletionReference) async throws {
        try await store.save(String(decoding: JSONEncoder().encode(reference), as: UTF8.self))
    }
    static func load() async -> AccountDeletionReference? {
        guard let text = try? await store.read(), let value = try? JSONDecoder().decode(AccountDeletionReference.self, from: Data(text.utf8)), value.isValid else { return nil }
        return value
    }
}

struct AccountDataProfile: Decodable, Sendable {
    struct Account: Decodable, Sendable { let publicId: String; let displayName: String }
    struct Billing: Decodable, Sendable {
        let hasSubscription: Bool
        let providers: [String]
        let hasPendingPurchase: Bool?
        var requiresAcknowledgement: Bool { hasSubscription || hasPendingPurchase == true }
    }
    let account: Account
    let billing: Billing?
}
struct MapImportResult: Decodable, Sendable {
    let matterCount: Int
    let personCount: Int
    let alreadyImported: Bool
    let sharingRestored: Bool
}
struct MapBackupDocument: Decodable, Sendable {
    struct Owner: Decodable, Sendable { let displayName: String }
    struct Person: Decodable, Sendable, Identifiable {
        let publicId: String; let displayName: String; let relationshipLabel: String?
        var id: String { publicId }
    }
    struct Boundaries: Decodable, Sendable {
        let containsPrivateMap: Bool; let restoresAccess: Bool; let credentialsIncluded: Bool
    }
    let schemaVersion: String
    let createdAt: String
    let owner: Owner
    let matters: [Matter]
    let people: [Person]
    let roles: [BackupRole]
    let officialChecks: [BackupCheck]
    let plan: BackupPlan
    struct BackupRole: Decodable, Sendable { let personPublicId: String; let matterPublicId: String?; let role: String; let scope: String; let status: String }
    struct BackupCheck: Decodable, Sendable { let providerKey: String; let completed: Bool; let policyVersion: String }
    struct BackupPlan: Decodable, Sendable { let motivation: String? }
    let boundaries: Boundaries
    var isValid: Bool {
        schemaVersion == "rillora-map-backup-v1" && boundaries.containsPrivateMap
        && !boundaries.restoresAccess && !boundaries.credentialsIncluded
        && matters.count <= 500 && people.count <= 200 && roles.count <= 1000 && officialChecks.count <= 50
        && Set(matters.map(\.id)).count == matters.count
        && Set(people.map(\.id)).count == people.count
    }
}

enum SavedCopyContent: Sendable {
    case backup(MapBackupDocument, Data)
    case encrypted(EncryptedStartHereArtifact)
    case directions(StartHerePackage)
    case text(String)
    static func read(data: Data, filename: String) throws -> SavedCopyContent {
        guard data.count <= 2 * 1024 * 1024 else { throw RilloraAPIError.invalidPayload(String(localized: "Choose a file no larger than 2 MB.")) }
        if filename.lowercased().hasSuffix(".txt"), let text = String(data: data, encoding: .utf8) { return .text(text) }
        if let backup = try? JSONDecoder().decode(MapBackupDocument.self, from: data), backup.isValid { return .backup(backup, data) }
        if let encrypted = try? JSONDecoder().decode(EncryptedStartHereArtifact.self, from: data),
           encrypted.schemaVersion == "rillora-encrypted-start-here-v1" { return .encrypted(encrypted) }
        throw RilloraAPIError.invalidPayload(String(localized: "Choose a Rillora map backup, encrypted package or text guide."))
    }
}
