import Foundation

enum SharingDetailLevel: String, Codable, CaseIterable, Identifiable, Sendable {
    case name, directions, details
    var id: String { rawValue }
    var title: String { switch self { case .name: "Name"; case .directions: "Directions"; case .details: "Details" } }
    var summary: String { switch self { case .name: "Title · Category"; case .directions: "Provider · Location · Wishes"; case .details: "All saved details" } }
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
    var label: String { switch self { case .pending: "Invitation pending"; case .expired: "Link expired"; case .accepted: "Connected"; case .revoked: "Disconnected" } }
}
struct SharingConnection: Decodable, Equatable, Sendable, Identifiable {
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
    var isValid: Bool { readOnly && purpose == "planner_directed" && version > 0 && UUID(uuidString: publicId) != nil && UUID(uuidString: personPublicId) != nil && grants.count <= 100 && Set(grants.map(\.matterPublicId)).count == grants.count && grants.allSatisfy { UUID(uuidString: $0.matterPublicId) != nil } }
}
struct SharingConnectionsEnvelope: Decodable, Sendable { let connections: [SharingConnection] }
struct SharingMutation: Decodable, Sendable {
    let connection: SharingConnection
    let invitationUrl: String?
}
struct SharingCreateRequest: Encodable, Sendable {
    let personPublicId: String
    let email: String
    let grants: [SharingGrant]
}
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
    let publicId: String
    let ownerName: String
    let acceptedAt: String
    let readOnly: Bool
    var id: String { publicId }
}
struct SharedMatterItem: Decodable, Equatable, Sendable, Identifiable {
    let connectionPublicId: String
    let ownerName: String
    let matterPublicId: String
    let detailLevel: SharingDetailLevel
    let fields: [String: String]
    var id: String { "\(connectionPublicId):\(matterPublicId)" }
    var title: String { fields["title"] ?? "Shared matter" }
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
    func fetchSharingConnections() async throws -> [SharingConnection]
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation
    func acceptSharingInvitation(token: String) async throws -> String
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope
}
struct UnavailableSharingService: SharingServing {
    private var unavailable: RilloraAPIError { .requestFailed("Sharing is not available. Try again when connected.") }
    func fetchSharingConnections() async throws -> [SharingConnection] { throw unavailable }
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation { throw unavailable }
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation { throw unavailable }
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation { throw unavailable }
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation { throw unavailable }
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation { throw unavailable }
    func acceptSharingInvitation(token: String) async throws -> String { throw unavailable }
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope { throw unavailable }
}
