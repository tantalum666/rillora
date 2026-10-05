import Foundation

enum SharingDetailLevel: String, Codable, CaseIterable, Identifiable, Sendable {
    case name, directions, details
    var id: String { rawValue }
    var title: String { switch self { case .name: String(localized: "Name"); case .directions: String(localized: "Directions"); case .details: String(localized: "Details") } }
    var summary: String { switch self { case .name: String(localized: "Title · Category"); case .directions: String(localized: "Provider · Location · Wishes"); case .details: String(localized: "All saved details") } }
    var allowedFields: Set<String> {
        let basic: Set<String> = ["title", "category"]
        let directions = basic.union(["institutionName", "locationHint", "desiredOutcome"])
        switch self { case .name: return basic; case .directions: return directions; case .details: return directions.union(["accountHint", "valueBand", "currencyCode", "importance", "assetType", "debtType", "documentType", "deviceModel", "billingCycle", "renewalDate", "cryptoCustody", "network", "walletAddress", "walletLabel", "assetSymbol", "notes"]) }
    }
}
struct SharingGrant: Codable, Equatable, Sendable, Identifiable {
    let matterPublicId: String
    var detailLevel: SharingDetailLevel
    var id: String { matterPublicId }
}
enum SharingConnectionStatus: String, Codable, Sendable {
    case pending, expired, accepted, revoked
    var label: String { switch self { case .pending: String(localized: "Invitation pending"); case .expired: String(localized: "Link expired"); case .accepted: String(localized: "Connected"); case .revoked: String(localized: "Disconnected") } }
}
struct SharingConnection: Decodable, Equatable, Sendable, Identifiable {
    var access: SharingConnectionAccess? = nil
    let publicId: String
    let personPublicId: String
    let personName: String
    let emailHint: String
    let status: SharingConnectionStatus
    let expiresAt: String
    let acceptedAt: String?
    let version: Int
    let grants: [SharingGrant]
    let readOnly: Bool
    let purpose: String
    var id: String { publicId }
    var isActive: Bool { status != .revoked }
    var statusLabel: String {
        if status == .revoked { return status.label }
        if access?.mode == .saved { return String(localized: "Updates paused") }
        if access?.mode == .paused { return String(localized: "Updates paused") }
        return status.label
    }
    var isValid: Bool { readOnly && purpose == "planner_directed" && version > 0 && UUID(uuidString: publicId) != nil && UUID(uuidString: personPublicId) != nil && grants.count <= 100 && Set(grants.map(\.matterPublicId)).count == grants.count && grants.allSatisfy { UUID(uuidString: $0.matterPublicId) != nil } }
}
enum SharingAccessMode: String, Decodable, Sendable { case live, saved, paused, none }
struct SharingConnectionAccess: Decodable, Equatable, Sendable {
    let mode: SharingAccessMode
    let isFreeRecipient: Bool
    let savedAt: String?
    let cutoffAt: String?
}
struct SharingAllowance: Decodable, Equatable, Sendable {
    let enforcementEnabled: Bool
    let limit: Int
    let used: Int
    let version: Int
    let freeConnectionPublicId: String?
    let paidUntil: String?
}
struct SharingAllowanceEnvelope: Decodable, Sendable { let access: SharingAllowance }
struct SharingLiveRequest: Encodable, Sendable { let expectedVersion: Int; let expectedAccessVersion: Int; let useFreeSlot: Bool }
struct SharingPreviewItem: Decodable, Sendable, Identifiable {
    let matterPublicId: String
    let detailLevel: SharingDetailLevel
    let fields: [String: String]
    var id: String { matterPublicId }
}
struct SharingPreview: Decodable, Sendable {
    var accessMode: SharingAccessMode? = nil
    let items: [SharingPreviewItem]
    let readOnly: Bool
    let purpose: String
    let preview: Bool
    func matches(_ grants: [SharingGrant]) -> Bool {
        readOnly && preview && purpose == "planner_directed" && ((accessMode == .saved || accessMode == .paused) ? items.count <= grants.count : items.count == grants.count) && Set(items.map(\.id)).count == items.count
            && items.allSatisfy { item in
                grants.contains { $0.matterPublicId == item.id && ((accessMode == .saved || accessMode == .paused) ? item.detailLevel.allowedFields.isSubset(of: $0.detailLevel.allowedFields) : $0.detailLevel == item.detailLevel) }
                && item.fields["title"] != nil && item.fields["category"] != nil
                && Set(item.fields.keys).isSubset(of: item.detailLevel.allowedFields)
            }
    }
}
struct SharingPreviewRequest: Encodable, Sendable { let grants: [SharingGrant]; var connectionPublicId: String? = nil }

struct SharingConnectionsEnvelope: Decodable, Sendable { let connections: [SharingConnection] }
struct SharingMutation: Decodable, Sendable {
    var access: SharingAllowance? = nil
    let connection: SharingConnection
    let invitationUrl: String?
}
struct SharingCreateRequest: Encodable, Sendable {
    let personPublicId: String
    let email: String
    let grants: [SharingGrant]
    var replaceConnection: SharingReplacement? = nil
}
struct SharingReplacement: Encodable, Sendable { let publicId: String; let expectedVersion: Int; let expectedAccessVersion: Int }
struct SharingPauseRequest: Encodable, Sendable { let expectedVersion: Int; let expectedAccessVersion: Int }
struct SharingUpdateRequest: Encodable, Sendable { let expectedVersion: Int; let grants: [SharingGrant] }
struct SharingLinkRequest: Encodable, Sendable { let expectedVersion: Int; let email: String?; let grants: [SharingGrant]? }
struct SharingInvitationRequest: Encodable, Sendable { let invitationToken: String }
struct SharingAcceptRequest: Encodable, Sendable { let invitationToken: String; let accepted = true }
struct SharingInvitation: Decodable, Equatable, Sendable {
    let publicId: String
    let ownerName: String
    let emailHint: String
    let status: SharingConnectionStatus
    let expiresAt: String
}
struct SharingInvitationEnvelope: Decodable, Sendable { let invitation: SharingInvitation }
struct SharingAcceptanceEnvelope: Decodable, Sendable {
    struct Connection: Decodable, Sendable { let publicId: String; let status: SharingConnectionStatus }
    let connection: Connection
    let readOnly: Bool
    let purpose: String
}
struct IncomingSharingConnection: Decodable, Sendable, Identifiable {
    var accessMode: SharingAccessMode? = nil
    let publicId: String
    let ownerName: String
    let acceptedAt: String
    let readOnly: Bool
    var id: String { publicId }
}
struct SharedMatterItem: Decodable, Equatable, Sendable, Identifiable {
    var accessMode: SharingAccessMode? = nil
    var savedAt: String? = nil
    var cutoffAt: String? = nil
    let connectionPublicId: String
    let ownerName: String
    let matterPublicId: String
    let detailLevel: SharingDetailLevel
    let fields: [String: String]
    var id: String { "\(connectionPublicId):\(matterPublicId)" }
    var title: String { fields["title"] ?? String(localized: "Shared matter") }
    var savedCopyLabel: String? {
        guard accessMode == .saved else { return nil }
        let fractional = ISO8601DateFormatter(); fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let date = savedAt.flatMap { fractional.date(from: $0) ?? ISO8601DateFormatter().date(from: $0) }
        return L10n.format("Updates paused · Saved %1$@", date?.formatted(date: .abbreviated, time: .omitted) ?? String(localized: "during the paid period"))
    }
    var isValid: Bool { UUID(uuidString: connectionPublicId) != nil && UUID(uuidString: matterPublicId) != nil && fields["title"] != nil && fields["category"] != nil && Set(fields.keys).isSubset(of: detailLevel.allowedFields) }
}
struct SharedWithMeEnvelope: Decodable, Sendable {
    let connections: [IncomingSharingConnection]
    let items: [SharedMatterItem]
    let readOnly: Bool
    let purpose: String
    var isValid: Bool {
        let ids = Set(connections.map(\.publicId))
        return readOnly && purpose == "planner_directed" && connections.allSatisfy { $0.readOnly && UUID(uuidString: $0.publicId) != nil }
            && items.allSatisfy { $0.isValid && ids.contains($0.connectionPublicId) }
    }
}
struct ReceivedInvitation: Identifiable {
    let token: String?
    let id = UUID()
    static func token(from value: String) -> String? {
        guard let url = URLComponents(string: value), ["https", "http", "rillora"].contains(url.scheme?.lowercased() ?? ""),
              let fragment = url.fragment, let token = URLComponents(string: "?\(fragment)")?.queryItems?.first(where: { $0.name == "invitation" })?.value,
              token.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { return nil }
        return token
    }
}

protocol SharingServing: Sendable {
    func previewSharing(grants: [SharingGrant], connectionPublicID: String?) async throws -> SharingPreview
    func pauseSharingLive(publicID: String, request: SharingPauseRequest) async throws -> SharingMutation
    func fetchSharingAllowance() async throws -> SharingAllowance?
    func selectSharingLive(publicID: String, request: SharingLiveRequest) async throws -> SharingMutation
    func fetchSharingConnections() async throws -> [SharingConnection]
    func previewSharing(grants: [SharingGrant]) async throws -> SharingPreview
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation
    func acceptSharingInvitation(token: String) async throws -> String
    func checkEmailVerification() async throws -> Bool
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope
}
extension SharingServing {
    func checkEmailVerification() async throws -> Bool {
        throw RilloraAPIError.requestFailed(String(localized: "Email verification could not be checked. Keep this invitation open and try again."))
    }
    func previewSharing(grants: [SharingGrant], connectionPublicID: String?) async throws -> SharingPreview {
        try await previewSharing(grants: grants)
    }
    func pauseSharingLive(publicID: String, request: SharingPauseRequest) async throws -> SharingMutation {
        throw RilloraAPIError.requestFailed(String(localized: "Updates could not be paused. Try again when connected."))
    }
    func fetchSharingAllowance() async throws -> SharingAllowance? { nil }
    func selectSharingLive(publicID: String, request: SharingLiveRequest) async throws -> SharingMutation {
        throw RilloraAPIError.requestFailed(String(localized: "Sharing could not be resumed. Try again when connected."))
    }
    func previewSharing(grants: [SharingGrant]) async throws -> SharingPreview {
        throw RilloraAPIError.requestFailed(String(localized: "The sharing preview is unavailable. Try again when connected."))
    }
}
struct UnavailableSharingService: SharingServing {
    private var unavailable: RilloraAPIError { .requestFailed(String(localized: "Sharing is not available. Try again when connected.")) }
    func fetchSharingConnections() async throws -> [SharingConnection] { throw unavailable }
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation { throw unavailable }
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation { throw unavailable }
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation { throw unavailable }
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation { throw unavailable }
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation { throw unavailable }
    func acceptSharingInvitation(token: String) async throws -> String { throw unavailable }
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope { throw unavailable }
}
