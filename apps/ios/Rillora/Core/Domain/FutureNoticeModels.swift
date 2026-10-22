import Foundation

enum FutureNoticeStatus: String, Decodable, Sendable {
    case pending, expired, acknowledged, declined, revoked
    var label: String {
        switch self {
        case .pending: String(localized: "Waiting for acknowledgement")
        case .expired: String(localized: "Notice link expired")
        case .acknowledged: String(localized: "Acknowledged · Contents remain private")
        case .declined: String(localized: "Notice declined or left")
        case .revoked: String(localized: "Notice revoked")
        }
    }
}

// This contract deliberately has no matters, titles, counts, grants or release conditions.
// Reject unknown fields, including fields added accidentally to a future API response.
private struct NoticeKey: CodingKey {
    var stringValue: String
    var intValue: Int? { nil }
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
}
private func noticeKeys(_ decoder: Decoder, _ allowed: Set<String>) throws {
    let keys = try decoder.container(keyedBy: NoticeKey.self).allKeys.map(\.stringValue)
    guard Set(keys).isSubset(of: allowed) else { throw FutureNoticeError.invalidResponse }
}
private func noticeBoundary(_ id: String, _ purpose: String, _ content: Bool, _ version: Int = 1) throws {
    guard UUID(uuidString: id) != nil, purpose == "future_notice", !content, version > 0 else {
        throw FutureNoticeError.invalidResponse
    }
}
private func noticeDate(_ value: String) -> Date? {
    let fractional = ISO8601DateFormatter()
    fractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    return fractional.date(from: value) ?? ISO8601DateFormatter().date(from: value)
}

struct FutureNotice: Decodable, Sendable, Equatable, Identifiable {
    let publicId: String
    let personPublicId: String
    let emailHint: String
    let status: FutureNoticeStatus
    let expiresAt: String
    let acknowledgedAt: String?
    let version: Int
    let purpose: String
    let contentAvailable: Bool
    var id: String { publicId }
    var isActive: Bool { [.pending, .expired, .acknowledged].contains(status) }
    var expirationDate: Date? { noticeDate(expiresAt) }
}
extension FutureNotice {
    private enum CodingKeys: String, CodingKey { case publicId, personPublicId, emailHint, status, expiresAt, acknowledgedAt, version, purpose, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["publicId", "personPublicId", "emailHint", "status", "expiresAt", "acknowledgedAt", "version", "purpose", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try c.decode(String.self, forKey: .publicId)
        personPublicId = try c.decode(String.self, forKey: .personPublicId)
        emailHint = try c.decode(String.self, forKey: .emailHint)
        status = try c.decode(FutureNoticeStatus.self, forKey: .status)
        expiresAt = try c.decode(String.self, forKey: .expiresAt)
        acknowledgedAt = try c.decodeIfPresent(String.self, forKey: .acknowledgedAt)
        version = try c.decode(Int.self, forKey: .version)
        purpose = try c.decode(String.self, forKey: .purpose)
        contentAvailable = try c.decode(Bool.self, forKey: .contentAvailable)
        try noticeBoundary(publicId, purpose, contentAvailable, version)
        guard UUID(uuidString: personPublicId) != nil, noticeDate(expiresAt) != nil,
              acknowledgedAt == nil || noticeDate(acknowledgedAt!) != nil else { throw FutureNoticeError.invalidResponse }
    }
}

struct FutureNoticePreview: Decodable, Sendable {
    let publicId: String
    let status: FutureNoticeStatus
    let expiresAt: String
    let purpose: String
    let contentAvailable: Bool
}
extension FutureNoticePreview {
    private enum CodingKeys: String, CodingKey { case publicId, status, expiresAt, purpose, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["publicId", "status", "expiresAt", "purpose", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try c.decode(String.self, forKey: .publicId)
        status = try c.decode(FutureNoticeStatus.self, forKey: .status)
        expiresAt = try c.decode(String.self, forKey: .expiresAt)
        purpose = try c.decode(String.self, forKey: .purpose)
        contentAvailable = try c.decode(Bool.self, forKey: .contentAvailable)
        try noticeBoundary(publicId, purpose, contentAvailable)
        guard status == .pending, noticeDate(expiresAt) != nil else { throw FutureNoticeError.invalidResponse }
    }
}

struct ReceivedFutureNotice: Decodable, Sendable, Identifiable, Equatable {
    let publicId: String
    let ownerName: String
    let status: FutureNoticeStatus
    let version: Int
    let purpose: String
    let contentAvailable: Bool
    var id: String { publicId }
}
extension ReceivedFutureNotice {
    private enum CodingKeys: String, CodingKey { case publicId, ownerName, status, version, purpose, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["publicId", "ownerName", "status", "version", "purpose", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try c.decode(String.self, forKey: .publicId)
        ownerName = try c.decode(String.self, forKey: .ownerName)
        status = try c.decode(FutureNoticeStatus.self, forKey: .status)
        version = try c.decode(Int.self, forKey: .version)
        purpose = try c.decode(String.self, forKey: .purpose)
        contentAvailable = try c.decode(Bool.self, forKey: .contentAvailable)
        try noticeBoundary(publicId, purpose, contentAvailable, version)
        guard !ownerName.isEmpty, ownerName.count <= 160, [.pending, .acknowledged].contains(status) else {
            throw FutureNoticeError.invalidResponse
        }
    }
}

struct FutureNoticeEnvelope<Value: Decodable & Sendable>: Decodable, Sendable {
    let notice: Value
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["notice"])
        notice = try decoder.container(keyedBy: NoticeKey.self).decode(Value.self, forKey: NoticeKey(stringValue: "notice")!)
    }
}
struct FutureNoticeMutation: Decodable, Sendable {
    let notice: FutureNotice
    let invitationUrl: String?
    var invitationURL: URL? { invitationUrl.flatMap(URL.init(string:)) }
    init(notice: FutureNotice, invitationUrl: String? = nil) { self.notice = notice; self.invitationUrl = invitationUrl }
    private enum CodingKeys: String, CodingKey { case notice, invitationUrl }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["notice", "invitationUrl"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        notice = try c.decode(FutureNotice.self, forKey: .notice)
        invitationUrl = try c.decodeIfPresent(String.self, forKey: .invitationUrl)
        if let invitationUrl, FutureNoticeLink.token(from: invitationUrl) == nil { throw FutureNoticeError.invalidResponse }
    }
}
struct FutureNoticeList: Decodable, Sendable {
    let notices: [ReceivedFutureNotice]
    private enum CodingKeys: String, CodingKey { case notices, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["notices", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        notices = try c.decode([ReceivedFutureNotice].self, forKey: .notices)
        guard try !c.decode(Bool.self, forKey: .contentAvailable) else { throw FutureNoticeError.invalidResponse }
        guard notices.count <= 100, notices.allSatisfy({ $0.status == .acknowledged }),
              Set(notices.map(\.id)).count == notices.count else { throw FutureNoticeError.invalidResponse }
    }
}
struct FutureNoticeDecision: Decodable, Sendable {
    let publicId: String
    let status: FutureNoticeStatus
    let version: Int
    let contentAvailable: Bool
    private enum CodingKeys: String, CodingKey { case publicId, status, version, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["publicId", "status", "version", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        publicId = try c.decode(String.self, forKey: .publicId)
        status = try c.decode(FutureNoticeStatus.self, forKey: .status)
        version = try c.decode(Int.self, forKey: .version)
        contentAvailable = try c.decode(Bool.self, forKey: .contentAvailable)
        try noticeBoundary(publicId, "future_notice", contentAvailable, version)
        guard [.acknowledged, .declined].contains(status) else { throw FutureNoticeError.invalidResponse }
    }
}
struct FutureNoticeDecisionEnvelope: Decodable, Sendable {
    let result: FutureNoticeDecision
    private enum CodingKeys: String, CodingKey { case result }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["result"])
        result = try decoder.container(keyedBy: CodingKeys.self).decode(FutureNoticeDecision.self, forKey: .result)
    }
}
struct FutureNoticeLeaveResult: Decodable, Sendable {
    private enum CodingKeys: String, CodingKey { case left, contentAvailable }
    init(from decoder: Decoder) throws {
        try noticeKeys(decoder, ["left", "contentAvailable"])
        let c = try decoder.container(keyedBy: CodingKeys.self)
        guard try c.decode(Bool.self, forKey: .left), try !c.decode(Bool.self, forKey: .contentAvailable) else {
            throw FutureNoticeError.invalidResponse
        }
    }
}

enum FutureNoticeLink {
    static func token(from value: String) -> String? {
        guard let url = URLComponents(string: value), url.scheme == "https",
              ["app.rillora.xyz", "app.staging.rillora.xyz"].contains(url.host ?? ""),
              url.user == nil, url.password == nil, url.port == nil, url.path == "/future-invite",
              url.queryItems == nil || (url.queryItems?.count == 1 && url.queryItems?.first?.name == "lang"
                && ["en", "zh-CN"].contains(url.queryItems?.first?.value ?? "")),
              let fragment = url.fragment, fragment.hasPrefix("invitation="),
              fragment.range(of: "^invitation=[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil else { return nil }
        return String(fragment.dropFirst("invitation=".count))
    }
}

enum FutureNoticeError: LocalizedError {
    case unavailable, invalidResponse
    var errorDescription: String? {
        switch self {
        case .unavailable: String(localized: "Arrangement notices are not available in this version.")
        case .invalidResponse: String(localized: "The arrangement notice could not be verified. Try again.")
        }
    }
    static func message(_ error: Error) -> String {
        if let error = error as? FutureNoticeError { return error.localizedDescription }
        if case RilloraAPIError.server(_, let code, _, _) = error {
            switch code {
            case "verified_email_required": return String(localized: "Verify your sign-in email, then try this notice again.")
            case "invitation_account_mismatch": return String(localized: "Use the email address this notice was intended for.")
            case "future_notice_changed": return String(localized: "This arrangement changed. Refresh before continuing.")
            case "future_notice_exists": return String(localized: "An active notice already exists for this person or email.")
            case "future_notice_unavailable", "invitation_unavailable", "invitation_expired", "not_found":
                return String(localized: "This notice is no longer available. Ask for a new link.")
            default: break
            }
        }
        return String(localized: "The arrangement could not be updated. Try again.")
    }
}

protocol FutureNoticeServing: Sendable {
    var futureNoticesEnabled: Bool { get }
    func fetchFutureNotice(personID: String) async throws -> FutureNotice?
    func createFutureNotice(personID: String, email: String) async throws -> FutureNoticeMutation
    func regenerateFutureNotice(publicID: String, version: Int) async throws -> FutureNoticeMutation
    func revokeFutureNotice(publicID: String, version: Int) async throws -> FutureNoticeMutation
    func resolveFutureNotice(token: String) async throws -> FutureNoticePreview
    func reviewFutureNotice(token: String) async throws -> ReceivedFutureNotice
    func respondFutureNotice(token: String, action: String, version: Int) async throws -> FutureNoticeDecision
    func fetchReceivedFutureNotices() async throws -> [ReceivedFutureNotice]
    func leaveFutureNotice(publicID: String, version: Int) async throws
}
