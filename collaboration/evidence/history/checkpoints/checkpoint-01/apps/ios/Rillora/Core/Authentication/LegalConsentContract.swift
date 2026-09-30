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
        termsVersion: "terms-2026-08-27-1",
        privacyVersion: "privacy-2026-09-15-1",
        consentTextVersion: "registration-clickwrap-2026-08-24-1",
        bundleSha256: "3eb7d7bf4d3c420c49946dbfcd322293136cce556407339dc0cafa0aa5f30602",
        acceptedTerms: true,
        acknowledgedPrivacy: true,
        acceptedElectronicRecords: true
    )
}

enum RilloraLegalURLs {
    static let terms = URL(string: "https://legal.rillora.xyz/terms")!
    static let privacy = URL(string: "https://legal.rillora.xyz/privacy")!
    static let subscriptions = URL(string: "https://legal.rillora.xyz/subscription-terms")!
    static let refunds = URL(string: "https://legal.rillora.xyz/refund-policy")!
}
