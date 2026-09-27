import SwiftUI

/// Preview target only. There is no API client, Apple SDK purchase or live identity.
struct ApplePurchaseLayoutPreview: View {
    @State private var context = ApplePurchasePreviewContext()
    @State private var largeText = false
    var body: some View {
        RilloraForm {
            Section {
                Text("Local fixture · No purchase or charge")
                    .font(.subheadline).foregroundStyle(RilloraTheme.muted)
                Toggle("Large text", isOn: $largeText)
                    .accessibilityIdentifier("preview.apple-large-text")
            }
            ApplePurchaseSection(purchase: context.coordinator, subscription: nil)
        }
        .rilloraStructuredList()
        .dynamicTypeSize(largeText ? .accessibility3 : .large)
        .navigationTitle("Purchase layout")
        .navigationBarTitleDisplayMode(.inline)
        .task { await context.coordinator.start(owner: context.owner) }
    }
}

@MainActor private final class ApplePurchasePreviewContext {
    let owner = UUID()
    let coordinator: ApplePurchaseCoordinator
    init() {
        coordinator = ApplePurchaseCoordinator(service: PreviewAppleQuoteService(), client: PreviewAppleCatalog(),
            storefront: PreviewAppleStorefront(), serviceMarket: "GLOBAL_US")
    }
}
private struct PreviewAppleQuoteService: ApplePurchaseServing {
    func fetchAppleQuote(serviceMarket: String, storefront: String) async throws -> AppleQuoteResponse {
        AppleQuoteResponse(contractVersion: "commerce-apple-purchase-v1", quote: ApplePurchaseQuote(bindingCode: "preview_fixture",
            priceCode: "family_preview_fixture", productId: RilloraStoreKitCatalog.familyAnnualProductID,
            serviceMarketCode: serviceMarket, storefrontCountryCode: storefront, currency: "USD",
            amountMinor: 9999, minorUnitExponent: 2, priceMilliunits: 99990, billingPeriod: "annual"),
            purchaseTerms: ApplePurchaseTerms(version: "family-annual-apple-20260926-1",
                termsVersion: LegalAcceptanceProof.current.termsVersion, subscriptionTermsVersion: "subscriptions-2026-08-27-1",
                refundPolicyVersion: "refunds-2026-08-27-1", legalBundleSha256: LegalAcceptanceProof.current.bundleSha256),
            requiresFreshEvaluation: true)
    }
    func pendingApplePurchase() async throws -> ApplePendingPurchaseResponse { ApplePendingPurchaseResponse(purchase: nil) }
    // All mutating operations deliberately retain the unavailable default.
}
private struct PreviewAppleCatalog: StoreKitPurchasing {
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        [.init(productID: RilloraStoreKitCatalog.familyAnnualProductID, displayName: "Family", description: "Layout fixture",
            displayPrice: "$99.99", subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            priceMilliunits: 99990, currencyCode: "USD", oneYearSubscription: true)]
    }
    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot { .init(transactions: [], containsUnverifiedTransaction: false) }
    func subscriptionStatuses(identifiers: Set<String>) async -> StoreKitSubscriptionStatusSnapshot { .empty }
    func purchase(productID: String, appAccountToken: UUID, expectedStorefrontCountryCode: String?) async throws -> StoreKitPurchaseOutcome { throw StoreKitClientError.productUnavailable }
    func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate> { AsyncStream { $0.finish() } }
    func subscriptionStatusUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> { AsyncStream { $0.finish() } }
    func finish(transactionID: UInt64) async {}
    func sync() async throws {}
}
private struct PreviewAppleStorefront: CommerceStorefrontProviding {
    func currentCountryCode() async -> String? { "USA" }
    func countryCodeUpdates() -> AsyncStream<String> { AsyncStream { $0.finish() } }
}
