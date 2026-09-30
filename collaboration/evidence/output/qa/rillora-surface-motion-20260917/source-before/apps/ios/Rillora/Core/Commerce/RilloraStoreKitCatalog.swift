import Foundation

enum RilloraStoreKitTestEnvironment: String, Equatable, Sendable {
    case disabled
    case xcodeLocal
    case appStoreSandboxCatalog
    case appStoreSandboxPurchase

    var subscriptionGroupID: String? {
        switch self {
        case .disabled:
            nil
        case .xcodeLocal:
            RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
        case .appStoreSandboxCatalog, .appStoreSandboxPurchase:
            RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
        }
    }

    var isEnabled: Bool { self != .disabled }

    var isAppStoreSandbox: Bool {
        self == .appStoreSandboxCatalog || self == .appStoreSandboxPurchase
    }
}

enum RilloraStoreKitCatalog {
    static let xcodeLocalFamilySubscriptionGroupID = "D7BCE9A1"
    static let appStoreFamilySubscriptionGroupID = "22325627"
    static let familyMonthlyProductID = "com.rillora.family.monthly"
    static let familyAnnualProductID = "com.rillora.family.annual"

    static let familyProductIDs: Set<String> = [
        familyMonthlyProductID,
        familyAnnualProductID,
    ]

    static func billingInterval(for productID: String) -> String? {
        switch productID {
        case familyMonthlyProductID: "monthly"
        case familyAnnualProductID: "annual"
        default: nil
        }
    }
}
