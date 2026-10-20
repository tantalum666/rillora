import Foundation

/// Localizes only the shared policy vocabulary; saved names and matter content stay untouched.
enum DisclosurePresentation {
    private struct Catalog: Decodable, Sendable {
        let schemaVersion: Int
        let states: [String: [String: String]]
        let stages: [String: [String: String]]
        let reasons: [String: [String: String]]
    }
    private static let catalog: Catalog? = {
        guard let url = Bundle.main.url(forResource: "disclosure-copy", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let result = try? JSONDecoder().decode(Catalog.self, from: data), result.schemaVersion == 1 else { return nil }
        return result
    }()
    private static var chinese: Bool { L10n.isSimplifiedChinese(bundle: .main) }
    private static func text(_ group: [String: [String: String]]?, _ key: String, chinese: Bool) -> String {
        (group?[key] ?? group?["unknown"])?[chinese ? "zh-CN" : "en"]
            ?? (chinese ? "暂时无法显示说明。" : "The explanation is unavailable.")
    }
    static func state(_ value: String, chinese: Bool? = nil) -> String {
        let key = value.hasSuffix("_appealed") ? "appealed" : value.hasSuffix("_canceled") ? "canceled" : value
        return text(catalog?.states, key, chinese: chinese ?? Self.chinese)
    }
    static func stage(_ value: String, chinese: Bool? = nil) -> String {
        text(catalog?.stages, value, chinese: chinese ?? Self.chinese)
    }
    static func reason(_ value: String, chinese: Bool? = nil) -> String {
        let key = catalog?.reasons.first(where: { $0.value["en"] == value })?.key ?? "unknown"
        return text(catalog?.reasons, key, chinese: chinese ?? Self.chinese)
    }
}
