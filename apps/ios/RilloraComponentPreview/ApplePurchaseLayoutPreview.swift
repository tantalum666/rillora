import SwiftUI

/// Preview target only. There is no API client, Apple SDK purchase or live identity.
struct ApplePurchaseLayoutPreview: View {
    @State private var context = ApplePurchasePreviewContext(currency: .hkd)
    var body: some View {
        RilloraForm {
            ApplePurchaseSection(purchase: context.coordinator, subscription: nil)
        }
        .rilloraStructuredList()
        .navigationTitle(String(localized: "Plan & access"))
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await context.coordinator.start(owner: context.owner)
        }
    }
}

private enum PreviewAppleCurrency: String, CaseIterable, Identifiable, Sendable {
    case usd = "USD", aud = "AUD", hkd = "HKD"
    var id: String { rawValue }
    var amountMinor: Int { switch self { case .usd: 11999; case .aud: 19999; case .hkd: 88800 } }
    var country: String { switch self { case .usd: "USA"; case .aud: "AUS"; case .hkd: "HKG" } }
    var displayPrice: String { switch self { case .usd: "$119.99"; case .aud: "$199.99"; case .hkd: "HK$888.00" } }
}

@MainActor private final class ApplePurchasePreviewContext {
    let owner = UUID()
    let coordinator: ApplePurchaseCoordinator
    init(currency: PreviewAppleCurrency) {
        coordinator = ApplePurchaseCoordinator(service: PreviewAppleQuoteService(currency: currency), client: PreviewAppleCatalog(currency: currency),
            storefront: PreviewAppleStorefront(currency: currency), serviceMarket: "GLOBAL_US")
    }
}
private struct PreviewAppleQuoteService: ApplePurchaseServing {
    let currency: PreviewAppleCurrency
    func fetchAppleQuote(serviceMarket: String, storefront: String, environment: ApplePurchaseEnvironment) async throws -> AppleQuoteResponse {
        AppleQuoteResponse(contractVersion: "commerce-apple-purchase-v1", quote: ApplePurchaseQuote(bindingCode: "preview_fixture",
            priceCode: "family_preview_fixture", productId: RilloraStoreKitCatalog.familyAnnualProductID,
            serviceMarketCode: serviceMarket, storefrontCountryCode: storefront, currency: currency.rawValue,
            amountMinor: currency.amountMinor, minorUnitExponent: 2, priceMilliunits: currency.amountMinor * 10, billingPeriod: "annual"),
            purchaseTerms: ApplePurchaseTerms(version: "family-annual-apple-20260926-1",
                termsVersion: LegalAcceptanceProof.current.termsVersion, subscriptionTermsVersion: "subscriptions-2026-08-27-1",
                refundPolicyVersion: "refunds-2026-08-27-1", legalBundleSha256: LegalAcceptanceProof.current.bundleSha256),
            requiresFreshEvaluation: true)
    }
    func pendingApplePurchase(environment: ApplePurchaseEnvironment) async throws -> ApplePendingPurchaseResponse { ApplePendingPurchaseResponse(purchase: nil) }
    // All mutating operations deliberately retain the unavailable default.
}
private struct PreviewAppleCatalog: StoreKitPurchasing {
    let currency: PreviewAppleCurrency
    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? { .production }
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        [.init(productID: RilloraStoreKitCatalog.familyAnnualProductID, displayName: "Family", description: "Layout fixture",
            displayPrice: currency.displayPrice, subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            priceMilliunits: currency.amountMinor * 10, currencyCode: currency.rawValue, oneYearSubscription: true)]
    }
    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot { .init(transactions: [], containsUnverifiedTransaction: false) }
    func subscriptionStatuses(identifiers: Set<String>) async -> StoreKitSubscriptionStatusSnapshot { .empty }
    func purchase(productID: String, appAccountToken: UUID, expectedStorefrontCountryCode: String?, expectedProduct: StoreKitProductSnapshot?) async throws -> StoreKitPurchaseOutcome { throw StoreKitClientError.productUnavailable }
    func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate> { AsyncStream { $0.finish() } }
    func subscriptionStatusUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> { AsyncStream { $0.finish() } }
    func finish(transactionID: UInt64) async {}
    func sync() async throws {}
}
private struct PreviewAppleStorefront: CommerceStorefrontProviding {
    let currency: PreviewAppleCurrency
    func currentCountryCode() async -> String? { currency.country }
    func countryCodeUpdates() -> AsyncStream<String> { AsyncStream { $0.finish() } }
}
