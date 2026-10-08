import Foundation

enum OfficialProviderGuideKind: String, Decodable, Sendable {
    case prepareNow, estateRequest, prepareAndRequest
    var label: String {
        switch self {
        case .prepareNow: String(localized: "Preparation guidance")
        case .estateRequest: String(localized: "After-death request")
        case .prepareAndRequest: String(localized: "Preparation and requests")
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
    var hostLabel: String { url?.host?.replacingOccurrences(of: "www.", with: "") ?? String(localized: "Official site") }
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
    let matterMatch: ProviderMatterMatch
    let translations: ProviderGuideTranslations?

    /// Locale overlays only change authored prose, never routing, source provenance,
    /// matching, or provider state. Incomplete overlays fall back as one whole guide.
    func localized(localeIdentifier: String = Bundle.main.preferredLocalizations.first ?? "en") -> Self {
        let language = localeIdentifier.replacingOccurrences(of: "_", with: "-").lowercased()
        guard (language == "zh" || language.hasPrefix("zh-")),
              let translation = translations?.values["zh-Hans"], translation.isComplete(for: self) else { return self }
        return Self(id: id, name: name, systemImage: systemImage, kind: kind, group: group,
                    aliases: aliases, summary: translation.summary,
                    prepareSteps: translation.prepareSteps, laterSteps: translation.laterSteps,
                    usuallyRequested: translation.usuallyRequested, boundary: translation.boundary,
                    links: zip(links, translation.links).map { source, text in
                        OfficialProviderLink(title: text.title, detail: text.detail,
                                             urlString: source.urlString, phase: source.phase)
                    }, lastReviewed: lastReviewed, matterMatch: matterMatch, translations: nil)
    }

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

/// Invalid optional translations must never make the reviewed English catalog unreadable.
struct ProviderGuideTranslations: Equatable, Decodable, Sendable {
    let values: [String: ProviderGuideTranslation]
    init(from decoder: any Decoder) throws {
        values = (try? decoder.singleValueContainer().decode([String: ProviderGuideTranslation].self)) ?? [:]
    }
}

struct ProviderGuideTranslation: Equatable, Decodable, Sendable {
    struct LinkText: Equatable, Decodable, Sendable { let title: String; let detail: String }
    let summary: String
    let prepareSteps: [String]
    let laterSteps: [String]
    let usuallyRequested: [String]
    let boundary: String
    let links: [LinkText]

    func isComplete(for source: OfficialProviderGuide) -> Bool {
        let texts = [summary, boundary] + prepareSteps + laterSteps + usuallyRequested
            + links.flatMap { [$0.title, $0.detail] }
        return prepareSteps.count == source.prepareSteps.count
            && laterSteps.count == source.laterSteps.count
            && usuallyRequested.count == source.usuallyRequested.count
            && links.count == source.links.count
            && texts.allSatisfy { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }
    }
}

struct ProviderMatterMatch: Equatable, Decodable, Sendable {
    let terms: [String]
    let exactProviderTerms: [String]
    let suppresses: [String]
}

struct OfficialProviderGuideGroup: Identifiable, Decodable, Sendable {
    let id: String
    let title: String

    // Known interface groups have authored keys; new source content stays verbatim.
    var localizedTitle: String {
        switch id {
        case "cloud": String(localized: "Cloud & email")
        case "social": String(localized: "Social accounts")
        case "money": String(localized: "Money & crypto")
        case "work": String(localized: "Work & passwords")
        case "software": String(localized: "Software & subscriptions")
        default: title
        }
    }
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

    // Only pass the title/provider fields the current viewer is allowed to see.
    // Notes, email/account hints and hidden owner records are never scanned.
    static func suggestions(title: String, provider: String?, category: String, custody: String? = nil) -> [OfficialProviderGuide] {
        guard ["account", "subscription", "device", "crypto_asset", "financial_asset"].contains(category) else { return [] }
        let eligible = all.filter { !(category == "crypto_asset" && custody == "self_custody" && $0.group == "money") }
        let providerValue = normalized(provider ?? "")
        let providerMatches = eligible.filter { guide in
            guide.matterMatch.exactProviderTerms.contains { normalized($0) == providerValue }
                || guide.matterMatch.terms.contains { containsTerm(providerValue, term: $0) }
        }
        let matches = providerMatches.isEmpty
            ? eligible.filter { guide in guide.matterMatch.terms.contains { containsTerm(normalized(title), term: $0) } }
            : providerMatches
        let suppressed = Set(matches.flatMap { $0.matterMatch.suppresses })
        return Array(matches.filter { !suppressed.contains($0.id) }.prefix(3))
    }

    static func suggestions(sharedFields: [String: String]) -> [OfficialProviderGuide] {
        suggestions(title: sharedFields["title"] ?? "", provider: sharedFields["institutionName"],
                    category: sharedFields["category"] ?? "", custody: sharedFields["cryptoCustody"])
    }

    private static func normalized(_ text: String) -> String {
        text.precomposedStringWithCompatibilityMapping.lowercased().trimmingCharacters(in: .whitespacesAndNewlines)
    }
    private static func containsTerm(_ text: String, term: String) -> Bool {
        let term = normalized(term)
        guard !term.isEmpty else { return false }
        if term.range(of: "[\\p{Han}]", options: .regularExpression) != nil { return text.contains(term) }
        let pattern = "(?<![a-z0-9])" + NSRegularExpression.escapedPattern(for: term) + "(?![a-z0-9])"
        return text.range(of: pattern, options: .regularExpression) != nil
    }
}

