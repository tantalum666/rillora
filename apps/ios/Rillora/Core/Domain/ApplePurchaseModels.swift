import Foundation

enum ApplePurchaseEnvironment: String, Codable, Sendable {
    case production, sandbox
    var route: String { self == .production ? "production" : "review" }
    var receiptContract: String { self == .production ? "commerce-apple-production-v1" : "commerce-apple-review-v1" }
    func matches(environment: ApplePurchaseEnvironment?, validationOnly: Bool?) -> Bool {
        self == .sandbox ? environment == .sandbox && validationOnly == true
            : (environment == nil || environment == .production) && validationOnly != true
    }
    func matches(transaction: StoreKitTransactionEvidence) -> Bool {
        !transaction.isXcodeEnvironment && transaction.environment.lowercased() == rawValue
    }
}

struct ApplePurchaseQuote: Codable, Equatable, Sendable {
    let bindingCode: String
    let priceCode: String
    let productId: String
    let serviceMarketCode: String
    let storefrontCountryCode: String
    let currency: String
    let amountMinor: Int
    let minorUnitExponent: Int
    let priceMilliunits: Int
    let billingPeriod: String

    var isValid: Bool {
        productId == RilloraStoreKitCatalog.familyAnnualProductID && billingPeriod == "annual"
            && amountMinor > 0 && (0...3).contains(minorUnitExponent)
            && priceMilliunits > 0 && priceMilliunits <= 9_007_199_254_740_991
            && Decimal(amountMinor) * pow(Decimal(10), 3 - minorUnitExponent) == Decimal(priceMilliunits)
            && currency.range(of: "^[A-Z]{3}$", options: .regularExpression) != nil
            && storefrontCountryCode.range(of: "^[A-Z]{3}$", options: .regularExpression) != nil
    }
}

struct ApplePurchaseTerms: Codable, Equatable, Sendable {
    let version: String
    let termsVersion: String
    let subscriptionTermsVersion: String
    let refundPolicyVersion: String
    let legalBundleSha256: String
    var isCurrent: Bool {
        version == "family-annual-apple-20260926-1"
            && termsVersion == LegalAcceptanceProof.current.termsVersion
            && legalBundleSha256 == LegalAcceptanceProof.current.bundleSha256
            && subscriptionTermsVersion == "subscriptions-2026-08-27-1"
            && refundPolicyVersion == "refunds-2026-08-27-1"
    }
}

struct AppleQuoteResponse: Decodable, Equatable, Sendable {
    let contractVersion: String
    let quote: ApplePurchaseQuote
    let purchaseTerms: ApplePurchaseTerms
    let requiresFreshEvaluation: Bool
    var environment: ApplePurchaseEnvironment? = nil
    var validationOnly: Bool? = nil
    func isValid(for expected: ApplePurchaseEnvironment) -> Bool { isValid && expected.matches(environment: environment, validationOnly: validationOnly) }
    var isValid: Bool {
        contractVersion == "commerce-apple-purchase-v1" && requiresFreshEvaluation
            && quote.isValid && purchaseTerms.isCurrent
    }
}

struct ApplePurchaseConsent: Encodable, Sendable {
    let version: String, termsVersion: String, subscriptionTermsVersion: String
    let refundPolicyVersion: String, legalBundleSha256: String
    let acceptedSubscriptionTerms: Bool, acceptedAnnualRenewal: Bool, acknowledgedCancellation: Bool
    init(terms: ApplePurchaseTerms, accepted: Bool) {
        version = terms.version; termsVersion = terms.termsVersion
        subscriptionTermsVersion = terms.subscriptionTermsVersion; refundPolicyVersion = terms.refundPolicyVersion
        legalBundleSha256 = terms.legalBundleSha256
        acceptedSubscriptionTerms = accepted; acceptedAnnualRenewal = accepted; acknowledgedCancellation = accepted
    }
}

struct ApplePurchasePreparation: Encodable, Sendable {
    let quote: ApplePurchaseQuote
    let consent: ApplePurchaseConsent
    let expectedAppAccountToken: UUID
}
struct ApplePurchaseIntent: Decodable, Equatable, Sendable {
    let contractVersion: String
    let orderReference: UUID
    let appAccountToken: UUID
    let state: String
    let grantsAccess: Bool
    var environment: ApplePurchaseEnvironment? = nil
    var validationOnly: Bool? = nil
    func isValid(for expected: ApplePurchaseEnvironment) -> Bool { isValid && expected.matches(environment: environment, validationOnly: validationOnly) }
    var isValid: Bool { contractVersion == "commerce-apple-purchase-v1" && !grantsAccess && ["prepared", "started", "pending"].contains(state) }
}
struct ApplePendingPurchase: Decodable, Equatable, Sendable {
    let orderReference: UUID
    let nonce: UUID
    let state: String
}
struct ApplePendingPurchaseResponse: Decodable, Sendable { let purchase: ApplePendingPurchase? }
struct ApplePurchaseTransition: Codable, Sendable { let action: String }
struct ApplePurchaseState: Decodable, Sendable { let state: String }
struct AppleTransactionRequest: Encodable, Sendable { let signedTransaction: String }
struct AppleTransactionResponse: Decodable, Sendable {
    struct Result: Decodable, Sendable {
        let accepted: Bool
        let status: String
        let finishAuthorized: Bool
        let authoritativeSnapshotLoaded: Bool
        let entitlementChanged: Bool
    }
    let contractVersion: String
    let result: Result
    var environment: ApplePurchaseEnvironment? = nil
    var validationOnly: Bool? = nil
    func isValid(for expected: ApplePurchaseEnvironment) -> Bool {
        isValid && contractVersion == expected.receiptContract && expected.matches(environment: environment, validationOnly: validationOnly)
    }
    var isValid: Bool {
        ["commerce-apple-production-v1", "commerce-apple-review-v1"].contains(contractVersion) && result.accepted
            && (result.finishAuthorized
                ? result.status == "applied" && result.authoritativeSnapshotLoaded
                : result.status == "pending" && !result.authoritativeSnapshotLoaded && !result.entitlementChanged)
    }
}
