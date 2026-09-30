import Foundation

struct CommerceBoundaries: Decodable, Equatable, Sendable {
    let serverAuthoritative: Bool
    let providerCallbackGrantsAccess: Bool
    let clientPurchaseResultGrantsAccess: Bool
    let billingStateCanTriggerClaim: Bool
    let billingStateCanTriggerDisclosure: Bool
    let storefrontPersistedToCustomerProfile: Bool
    let oneActiveRenewalProviderPerHouseholdPlan: Bool

    var preservesSafetyBoundary: Bool {
        serverAuthoritative
            && !providerCallbackGrantsAccess
            && !clientPurchaseResultGrantsAccess
            && !billingStateCanTriggerClaim
            && !billingStateCanTriggerDisclosure
            && !storefrontPersistedToCustomerProfile
            && oneActiveRenewalProviderPerHouseholdPlan
    }
}

struct CommerceSubscription: Decodable, Equatable, Sendable {
    let publicId: String
    let planCode: String
    let planVersion: Int
    let renewalProvider: String
    let state: String
    let currentPeriodEndsAt: String?
    let cancelAtPeriodEnd: Bool
}

struct CommerceCurrentAccess: Decodable, Equatable, Sendable {
    let planCode: String
    let planVersion: Int
    let subscription: CommerceSubscription?
    let managementDestination: String
}

struct CommerceEntitlement: Decodable, Equatable, Sendable {
    let code: String
    let allowance: Int?
    let source: String
}

struct CommerceCapability: Decodable, Equatable, Sendable {
    let code: String
    let status: String
    let allowance: Int?
    let enforcementMode: String
    let baselineTrustControl: Bool
}

struct CommercePlan: Decodable, Equatable, Sendable {
    let planCode: String
    let planVersion: Int
    let status: String
    let capabilities: [CommerceCapability]
}

struct CommerceOffer: Decodable, Equatable, Sendable, Identifiable {
    let priceCode: String
    let planCode: String
    let planVersion: Int
    let amountMinor: Int
    let minorUnitExponent: Int
    let currencyCode: String
    let billingInterval: String
    let taxBehavior: String
    let status: String
    let purchasable: Bool

    var id: String { priceCode }

    var formattedPrice: String {
        let divisor = pow(10.0, Double(minorUnitExponent))
        let amount = Double(amountMinor) / divisor
        return amount.formatted(
            .currency(code: currencyCode)
                .precision(.fractionLength(minorUnitExponent))
        )
    }
}

struct CommerceStatus: Decodable, Equatable, Sendable {
    let contractVersion: String
    let billingOpen: Bool
    let serviceMarketCode: String?
    let marketPolicyVersion: Int?
    let currentAccess: CommerceCurrentAccess
    let entitlements: [CommerceEntitlement]
    let plans: [CommercePlan]
    let offers: [CommerceOffer]
    let boundaries: CommerceBoundaries
}

struct CommercePurchaseRouteRequest: Encodable, Equatable, Sendable {
    let clientSurface: String
    let serviceMarketCode: String
    let appleStorefrontCountryCode: String
    let intent: String

    static func iOS(
        serviceMarketCode: String,
        appleStorefrontCountryCode: String,
        intent: String = "plan_access"
    ) -> CommercePurchaseRouteRequest {
        CommercePurchaseRouteRequest(
            clientSurface: "ios",
            serviceMarketCode: serviceMarketCode,
            appleStorefrontCountryCode: appleStorefrontCountryCode,
            intent: intent
        )
    }
}

struct CommerceRoutePolicy: Decodable, Equatable, Sendable {
    let code: String
    let version: Int
    let externalOfferAllowed: Bool
}

struct CommercePurchaseRouteResponse: Decodable, Equatable, Sendable {
    let contractVersion: String
    let purchaseRoute: String
    let reason: String
    let policy: CommerceRoutePolicy?
    let activeSubscription: CommerceSubscription?
    let managementDestination: String
    let requiresFreshEvaluation: Bool
    let boundaries: CommerceBoundaries
}

struct StoreKitSandboxTransactionRequest: Encodable, Equatable, Sendable {
    let signedTransaction: String
    let storefrontCountryCode: String
}

struct StoreKitSandboxTransactionResult: Decodable, Equatable, Sendable {
    let accepted: Bool
    let status: String
    let providerEventReference: String
    let finishAuthorized: Bool
    let authoritativeSnapshotLoaded: Bool
    let entitlementChanged: Bool
    let sandboxOnly: Bool
}

struct StoreKitSandboxTransactionBoundaries: Decodable, Equatable, Sendable {
    let sandboxOnly: Bool
    let serverAuthoritative: Bool
    let authoritativeSnapshotLoaded: Bool
    let transactionFinishAuthorized: Bool
    let entitlementMutationEnabled: Bool
    let purchaseRouteEnabled: Bool
}

struct StoreKitSandboxTransactionResponse: Decodable, Equatable, Sendable {
    let contractVersion: String
    let result: StoreKitSandboxTransactionResult
    let boundaries: StoreKitSandboxTransactionBoundaries

    var preservesSafetyBoundary: Bool {
        let finishStateIsConsistent = result.finishAuthorized
            ? ["applied", "duplicate"].contains(result.status)
            : ["needs_authoritative_snapshot", "duplicate"].contains(result.status)
        return contractVersion == "commerce-storekit-sandbox-v1"
            && result.accepted
            && result.sandboxOnly
            && !result.entitlementChanged
            && boundaries.sandboxOnly
            && boundaries.serverAuthoritative
            && !boundaries.entitlementMutationEnabled
            && !boundaries.purchaseRouteEnabled
            && result.authoritativeSnapshotLoaded
                == boundaries.authoritativeSnapshotLoaded
            && result.finishAuthorized
                == boundaries.transactionFinishAuthorized
            && finishStateIsConsistent
    }
}
