import Foundation

enum OfficialProviderGuideKind: String, Decodable, Sendable {
    case prepareNow, estateRequest, prepareAndRequest
    var label: String {
        switch self {
        case .prepareNow: "Preparation guidance"
        case .estateRequest: "After-death request"
        case .prepareAndRequest: "Preparation and requests"
        }
    }
}

struct OfficialProviderLink: Identifiable, Equatable, Decodable, Sendable {
    let title: String
    let detail: String
    let urlString: String
    let phase: String
    var id: String { urlString }
    var url: URL? {
        guard let url = URL(string: urlString), url.scheme == "https" else { return nil }
        return url
    }
    var hostLabel: String { url?.host?.replacingOccurrences(of: "www.", with: "") ?? "Official site" }
}

struct OfficialProviderGuide: Identifiable, Equatable, Decodable, Sendable {
    let id: String
    let name: String
    let systemImage: String
    let kind: OfficialProviderGuideKind
    let group: String
    let aliases: [String]
    let summary: String
    let prepareSteps: [String]
    let laterSteps: [String]
    let usuallyRequested: [String]
    let boundary: String
    let links: [OfficialProviderLink]
    let lastReviewed: String

    var supportsSelfReportedCheck: Bool { OfficialProviderGuideCatalog.selfReportedProviderKeys.contains(id) }
    var initialPart: String { kind == .estateRequest ? "later" : "now" }
    func matches(_ query: String) -> Bool {
        query.isEmpty || ([name, summary] + aliases).contains { $0.localizedStandardContains(query) }
    }
    func links(for part: String) -> [OfficialProviderLink] {
        guard part != "details" else { return links }
        let phase = part == "now" ? "prepare" : "afterDeath"
        let matching = links.filter { $0.phase == phase || $0.phase == "both" }
        return matching.isEmpty ? links : matching
    }
}

struct OfficialProviderGuideGroup: Identifiable, Decodable, Sendable {
    let id: String
    let title: String
}

private struct ProviderGuideDocument: Decodable, Sendable {
    let schemaVersion: Int
    let selfReportedProviderKeys: [String]
    let groups: [OfficialProviderGuideGroup]
    let guides: [OfficialProviderGuide]
}

enum OfficialProviderGuideCatalog {
    // Web and native ship this same reviewed content, not independent paraphrases.
    private static let document: ProviderGuideDocument? = {
        guard let url = Bundle.main.url(forResource: "provider-guides", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let result = try? JSONDecoder().decode(ProviderGuideDocument.self, from: data),
              result.schemaVersion == 1 else { return nil }
        return result
    }()
    static var isAvailable: Bool { document != nil }
    static let selfReportedProviderKeys = Set(document?.selfReportedProviderKeys ?? [])
    static let groups = document?.groups ?? []
    static let all = document?.guides ?? []
    static var priorityGuides: [OfficialProviderGuide] { all.filter(\.supportsSelfReportedCheck) }
    static var estateRequestGuides: [OfficialProviderGuide] { all.filter { !$0.supportsSelfReportedCheck } }
    static func guide(for providerKey: String) -> OfficialProviderGuide? { all.first { $0.id == providerKey } }
}
