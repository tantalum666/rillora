import Foundation

struct FamilyMaintenanceOverview: Decodable, Sendable {
    struct Access: Decodable, Sendable { let mode: String; let canCreate: Bool }
    struct Boundaries: Decodable, Sendable {
        let ownerApprovalRequired: Bool; let recipientScopeEnforced: Bool
        let externalNotificationsSent: Bool; let billingActivated: Bool
        var isValid: Bool { ownerApprovalRequired && recipientScopeEnforced && !externalNotificationsSent && !billingActivated }
    }
    let contractVersion: String
    let access: Access
    let settings: FamilyReviewSettings
    let eligible: [FamilyReviewSelection]
    let rounds: [FamilyReviewRound]
    let incoming: [FamilyReviewTask]
    let history: [FamilyReviewChange]
    let serverTime: String
    let boundaries: Boundaries
    let shareUrl: String?
    var shareURL: URL? {
        guard let shareUrl, let url = URL(string: shareUrl),
              url.scheme == "https" || (url.scheme == "http" && ["localhost", "127.0.0.1"].contains(url.host ?? "")),
              url.user == nil, url.password == nil, url.fragment == nil,
              url.path == "/account", url.query == "next=reviews" else { return nil }
        return url
    }
    var openRound: FamilyReviewRound? { rounds.first { $0.state == "open" } }
    var isValid: Bool {
        contractVersion == "family-maintenance-v1" && boundaries.isValid
        && ["preview", "family", "unavailable"].contains(access.mode)
        && access.canCreate == (access.mode != "unavailable")
        && [0, 30, 90, 180, 365].contains(settings.cadenceDays)
        && rounds.allSatisfy { $0.tasks.allSatisfy(\.isValid) }
        && incoming.allSatisfy { $0.isValid && !$0.canManage && $0.scopeAvailable }
        && history.allSatisfy { FamilyReviewTask.validFields($0.beforeFields) && FamilyReviewTask.validFields($0.afterFields) }
    }
}
struct FamilyReviewSettings: Decodable, Sendable {
    let version: Int; let cadenceDays: Int; let nextReviewAt: String?; let collaboratorConnectionPublicId: String?
}
struct FamilyReviewSelection: Decodable, Sendable, Identifiable {
    let connectionPublicId: String; let personName: String; let matterPublicId: String
    let title: String; let version: Int; let missingLocation: Bool
    var id: String { "\(connectionPublicId):\(matterPublicId)" }
}
struct FamilyReviewRound: Decodable, Sendable, Identifiable {
    let publicId: String; let state: String; let version: Int
    let dueAt: String; let createdAt: String; let completedAt: String?
    let tasks: [FamilyReviewTask]
    var id: String { publicId }
    var resolvedCount: Int { tasks.filter(\.isResolved).count }
    var canFinish: Bool { !tasks.isEmpty && resolvedCount == tasks.count }
}
struct FamilyReviewTask: Decodable, Sendable, Identifiable {
    let publicId: String; let roundPublicId: String; let roundState: String
    let matterPublicId: String; let connectionPublicId: String
    let ownerName: String; let personName: String; let title: String
    let state: String; let version: Int; let sourceVersion: Int; let currentVersion: Int
    let fields: [String: String]; let proposal: [String: String]?; let reason: String?
    let dueAt: String; let respondedAt: String?; let decidedAt: String?
    let scopeAvailable: Bool; let isStale: Bool; let canRespond: Bool; let canSuggest: Bool; let canManage: Bool
    var id: String { publicId }
    var isResolved: Bool { scopeAvailable && !isStale && ["confirmed", "applied", "dismissed"].contains(state) }
    var statusLabel: String {
        if !scopeAvailable { return String(localized: "Sharing changed") }
        if isStale { return String(localized: "Check again") }
        switch state {
        case "waiting": return String(localized: "Waiting")
        case "confirmed": return String(localized: "Checked")
        case "needs_update": return String(localized: "Needs attention")
        case "suggested": return String(localized: "Update suggested")
        case "applied": return String(localized: "Updated")
        case "dismissed": return String(localized: "Kept current")
        default: return String(localized: "Unavailable")
        }
    }
    var symbol: String { isResolved ? "checkmark.circle" : state == "suggested" ? "pencil.circle" : "clock" }
    static func validFields(_ fields: [String: String]) -> Bool { Set(fields.keys).isSubset(of: ["institutionName", "locationHint"]) }
    var isValid: Bool {
        [publicId, matterPublicId, connectionPublicId, roundPublicId].allSatisfy { UUID(uuidString: $0) != nil }
        && version > 0 && sourceVersion > 0 && currentVersion > 0
        && ["waiting", "confirmed", "needs_update", "suggested", "applied", "dismissed"].contains(state)
        && Self.validFields(fields) && (proposal.map(Self.validFields) ?? true)
    }
}
struct FamilyReviewChange: Decodable, Sendable, Identifiable {
    let publicId: String; let matterPublicId: String; let title: String; let suggestedBy: String
    let sourceVersion: Int; let savedVersion: Int; let createdAt: String
    let beforeFields: [String: String]; let afterFields: [String: String]
    var id: String { publicId }
}
struct FamilyReviewStartRequest: Encodable, Sendable {
    struct Item: Encodable, Sendable { let connectionPublicId: String; let matterPublicId: String }
    let requestKey: String; let dueAt: String; let items: [Item]
}
struct FamilyReviewSettingsRequest: Encodable, Sendable {
    let expectedVersion: Int; let cadenceDays: Int; let collaboratorConnectionPublicId: String?; let nextReviewAt: String?
    enum CodingKeys: String, CodingKey { case expectedVersion, cadenceDays, collaboratorConnectionPublicId, nextReviewAt }
    func encode(to encoder: any Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(expectedVersion, forKey: .expectedVersion); try c.encode(cadenceDays, forKey: .cadenceDays)
        try c.encode(collaboratorConnectionPublicId, forKey: .collaboratorConnectionPublicId)
        try c.encode(nextReviewAt, forKey: .nextReviewAt)
    }
}
struct FamilyReviewResponseRequest: Encodable, Sendable {
    let expectedVersion: Int; let response: String; let reason: String?; let proposal: [String: String]?
}
struct FamilyReviewActionRequest: Encodable, Sendable { let expectedVersion: Int; let action: String }
struct FamilyReviewAcknowledgement: Decodable, Sendable {}

protocol FamilyMaintenanceServing: Sendable {
    func fetchFamilyMaintenance() async throws -> FamilyMaintenanceOverview
    func startFamilyReview(_ request: FamilyReviewStartRequest) async throws
    func saveFamilyReviewSettings(_ request: FamilyReviewSettingsRequest) async throws
    func respondToFamilyReview(_ id: String, request: FamilyReviewResponseRequest) async throws
    func decideFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws
    func closeFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws
}
struct UnavailableFamilyMaintenanceService: FamilyMaintenanceServing {
    private var error: RilloraAPIError { .requestFailed(String(localized: "Shared reviews are unavailable. Try again when connected.")) }
    func fetchFamilyMaintenance() async throws -> FamilyMaintenanceOverview { throw error }
    func startFamilyReview(_ request: FamilyReviewStartRequest) async throws { throw error }
    func saveFamilyReviewSettings(_ request: FamilyReviewSettingsRequest) async throws { throw error }
    func respondToFamilyReview(_ id: String, request: FamilyReviewResponseRequest) async throws { throw error }
    func decideFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws { throw error }
    func closeFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws { throw error }
}

enum FamilyReviewDate {
    static func parse(_ value: String?) -> Date? {
        guard let value else { return nil }
        let parser = ISO8601DateFormatter(); parser.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return parser.date(from: value) ?? ISO8601DateFormatter().date(from: value)
    }
    static func label(_ value: String?) -> String { parse(value)?.formatted(date: .abbreviated, time: .omitted) ?? String(localized: "Not scheduled") }
}
