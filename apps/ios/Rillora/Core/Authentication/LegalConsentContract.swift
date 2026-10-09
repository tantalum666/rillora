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
        bundleSha256: "515e02711d81fd8e7574b993b590914737731109fbd3035a68bd2a21e8cf2124",
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
