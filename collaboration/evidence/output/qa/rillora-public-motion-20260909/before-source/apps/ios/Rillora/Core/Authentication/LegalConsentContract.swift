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
        privacyVersion: "privacy-2026-08-27-1",
        consentTextVersion: "registration-clickwrap-2026-08-24-1",
        bundleSha256: "73d9cb6039b97f72d802e543d03944355e68b2bc59a7f859326ce3236b704d2b",
        acceptedTerms: true,
        acknowledgedPrivacy: true,
        acceptedElectronicRecords: true
    )
}

enum RilloraLegalURLs {
    static let terms = URL(string: "https://legal.rillora.xyz/terms")!
    static let privacy = URL(string: "https://legal.rillora.xyz/privacy")!
}
