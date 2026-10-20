import Foundation

struct LegalAcceptanceProof: Codable, Equatable, Sendable {
    let termsVersion: String
    let privacyVersion: String
    let consentTextVersion: String
    let bundleSha256: String
    let acceptedTerms: Bool
    let acknowledgedPrivacy: Bool
    let acceptedElectronicRecords: Bool

    static let current = LegalAcceptanceProof(
        termsVersion: "terms-2026-10-09-1",
        privacyVersion: "privacy-2026-09-15-1",
        consentTextVersion: "registration-clickwrap-2026-10-09-1",
        bundleSha256: "c983dc26bb372fba66b8df467d6e4c0ea1d85a2f4d94d86104b4bffa8d7f3ddb",
        acceptedTerms: true,
        acknowledgedPrivacy: true,
        acceptedElectronicRecords: true
    )
}

enum RilloraLegalURLs {
    static var terms: URL { localized("terms") }
    static var privacy: URL { localized("privacy") }
    static var subscriptions: URL { localized("subscription-terms") }
    static var refunds: URL { localized("refund-policy") }

    static func localized(_ path: String, bundle: Bundle = .main) -> URL {
        var url = URLComponents(string: "https://legal.rillora.xyz/\(path)")!
        url.queryItems = [URLQueryItem(name: "lang", value: L10n.isSimplifiedChinese(bundle: bundle) ? "zh-CN" : "en")]
        return url.url!
    }
}
