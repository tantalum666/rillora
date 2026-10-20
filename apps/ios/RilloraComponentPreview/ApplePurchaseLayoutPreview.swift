import SwiftUI

/// Preview target only. There is no API client, Apple SDK purchase or live identity.
struct ApplePurchaseLayoutPreview: View {
    @State private var context = ApplePurchasePreviewContext(currency: .hkd)
    var body: some View {
        PlanAccessView(store: context.commerce, appAccountToken: context.owner)
        .task {
            await context.commerce.start(appAccountToken: context.owner)
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

private enum PreviewApplePlanState: String, Sendable {
    case ready, subscribed, unavailable, missingProduct
    static var selected: Self {
        Self(rawValue: ProcessInfo.processInfo.environment["RILLORA_PREVIEW_PLAN_STATE"] ?? "ready") ?? .ready
    }
}

@MainActor private final class ApplePurchasePreviewContext {
    let owner = UUID()
    let commerce: CommerceStore
    init(currency: PreviewAppleCurrency) {
        let state = PreviewApplePlanState.selected
        commerce = CommerceStore(service: PreviewAppleQuoteService(currency: currency, state: state),
            storefrontProvider: PreviewAppleStorefront(currency: currency),
            storeKitClient: PreviewAppleCatalog(currency: currency, state: state),
            serviceMarketCode: "GLOBAL_US", storeKitProductionEnabled: true)
    }
}
private struct PreviewAppleQuoteService: CommerceServing {
    let currency: PreviewAppleCurrency
    let state: PreviewApplePlanState
    private var subscription: CommerceSubscription? {
        state == .subscribed ? CommerceSubscription(publicId: "fixture-only", planCode: "family", planVersion: 1,
            renewalProvider: "storekit", state: "active", currentPeriodEndsAt: nil, cancelAtPeriodEnd: false) : nil
    }
    private var boundaries: CommerceBoundaries {
        CommerceBoundaries(serverAuthoritative: true, providerCallbackGrantsAccess: false,
            clientPurchaseResultGrantsAccess: false, billingStateCanTriggerClaim: false,
            billingStateCanTriggerDisclosure: false, storefrontPersistedToCustomerProfile: false,
            oneActiveRenewalProviderPerHouseholdPlan: true)
    }
    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        CommerceStatus(contractVersion: "commerce-status-v1", billingOpen: false, serviceMarketCode: serviceMarketCode,
            marketPolicyVersion: 1, currentAccess: CommerceCurrentAccess(planCode: subscription == nil ? "free" : "family",
                planVersion: 1, subscription: subscription, managementDestination: "apple_app_store"),
            entitlements: [], plans: [], offers: [], boundaries: boundaries)
    }
    func resolvePurchaseRoute(request: CommercePurchaseRouteRequest) async throws -> CommercePurchaseRouteResponse {
        CommercePurchaseRouteResponse(contractVersion: "commerce-purchase-route-v1", purchaseRoute: "none",
            reason: "preview_fixture", policy: nil, activeSubscription: subscription,
            managementDestination: "apple_app_store", requiresFreshEvaluation: true, boundaries: boundaries)
    }
    func fetchAppleQuote(serviceMarket: String, storefront: String, environment: ApplePurchaseEnvironment) async throws -> AppleQuoteResponse {
        guard state == .ready else { throw StoreKitClientError.productUnavailable }
        return AppleQuoteResponse(contractVersion: "commerce-apple-purchase-v1", quote: ApplePurchaseQuote(bindingCode: "preview_fixture",
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
    let state: PreviewApplePlanState
    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? { .production }
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        guard state != .missingProduct else { throw StoreKitClientError.productUnavailable }
        return [.init(productID: RilloraStoreKitCatalog.familyAnnualProductID, displayName: "Family", description: "Layout fixture",
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
