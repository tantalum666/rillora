import Foundation
import StoreKit

struct StoreKitProductSnapshot: Equatable, Identifiable, Sendable {
    let productID: String
    let displayName: String
    let description: String
    let displayPrice: String
    let subscriptionGroupID: String
    var priceMilliunits: Int? = nil
    var currencyCode: String? = nil
    var oneYearSubscription: Bool = false

    var id: String { productID }

    /// Keep Apple's localized amount, while making ambiguous dollar symbols explicit.
    var displayPriceWithCurrency: String {
        guard let currencyCode, !currencyCode.isEmpty else { return displayPrice }
        return displayPrice.contains(currencyCode) ? displayPrice : "\(currencyCode) \(displayPrice)"
    }
}

struct StoreKitTransactionEvidence: Equatable, Sendable {
    let transactionID: UInt64
    let originalTransactionID: UInt64
    let productID: String
    let subscriptionGroupID: String?
    let appAccountToken: UUID?
    let environment: String
    let storefrontCountryCode: String
    let purchaseDate: Date
    let expirationDate: Date?
    let revocationDate: Date?
    let transactionReason: String
    let signedTransaction: String
    let isXcodeEnvironment: Bool
}

struct StoreKitLocalTransactionRecord: Equatable, Identifiable, Sendable {
    let transactionID: UInt64
    let originalTransactionID: UInt64
    let productID: String
    let storefrontCountryCode: String
    let purchaseDate: Date
    let expirationDate: Date?
    let revocationDate: Date?
    let transactionReason: String

    var id: UInt64 { transactionID }
}

enum StoreKitSubscriptionState: String, Equatable, Sendable {
    case subscribed
    case expired
    case inBillingRetryPeriod
    case inGracePeriod
    case revoked
    case unknown
}

struct StoreKitSubscriptionStatusEvidence: Equatable, Sendable {
    let transaction: StoreKitTransactionEvidence
    let state: StoreKitSubscriptionState
    let willAutoRenew: Bool
    let isInBillingRetry: Bool
    let gracePeriodExpirationDate: Date?
    let signedRenewalInfo: String
}

struct StoreKitLocalSubscriptionStatusRecord: Equatable, Identifiable, Sendable {
    let transactionID: UInt64
    let originalTransactionID: UInt64
    let productID: String
    let state: StoreKitSubscriptionState
    let willAutoRenew: Bool
    let isInBillingRetry: Bool
    let expirationDate: Date?
    let gracePeriodExpirationDate: Date?

    var id: UInt64 { originalTransactionID }
}

struct StoreKitEntitlementSnapshot: Equatable, Sendable {
    let transactions: [StoreKitTransactionEvidence]
    let containsUnverifiedTransaction: Bool
}

struct StoreKitSubscriptionStatusSnapshot: Equatable, Sendable {
    let statuses: [StoreKitSubscriptionStatusEvidence]
    let containsUnverifiedStatus: Bool
    let loadFailed: Bool

    static let empty = StoreKitSubscriptionStatusSnapshot(
        statuses: [],
        containsUnverifiedStatus: false,
        loadFailed: false
    )
}

enum StoreKitPurchaseOutcome: Equatable, Sendable {
    case verified(StoreKitTransactionEvidence)
    case pending
    case userCancelled
    case unverified
    case quoteChanged
}

enum StoreKitTransactionUpdate: Equatable, Sendable {
    case verified(StoreKitTransactionEvidence)
    case unverified(productID: String)
}

protocol StoreKitPurchasing: Sendable {
    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment?
    func refreshAppEnvironment() async throws -> ApplePurchaseEnvironment?
    func purchaseIntents() -> AsyncStream<String>
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot]
    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot
    func unfinishedTransactions(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot
    func subscriptionStatuses(
        identifiers: Set<String>
    ) async -> StoreKitSubscriptionStatusSnapshot
    func purchase(
        productID: String,
        appAccountToken: UUID,
        expectedStorefrontCountryCode: String?,
        expectedProduct: StoreKitProductSnapshot?
    ) async throws -> StoreKitPurchaseOutcome
    func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate>
    func subscriptionStatusUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitSubscriptionStatusSnapshot>
    func finish(transactionID: UInt64) async
    func sync() async throws
}

extension StoreKitPurchasing {
    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? { nil }
    func refreshAppEnvironment() async throws -> ApplePurchaseEnvironment? { nil }
    func purchaseIntents() -> AsyncStream<String> { AsyncStream { $0.finish() } }
    func unfinishedTransactions(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        .init(transactions: [], containsUnverifiedTransaction: false)
    }
}

actor AppleStoreKitClient: StoreKitPurchasing {
    nonisolated private let expectedSubscriptionGroupID: String
    private var productsByID: [String: Product] = [:]
    private var intendedProductsByID: [String: Product] = [:]
    private var transactionsAwaitingFinish: [UInt64: Transaction] = [:]

    init(expectedSubscriptionGroupID: String) {
        self.expectedSubscriptionGroupID = expectedSubscriptionGroupID
    }

    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? {
        // Routine loading is silent. Only explicit Restore may authenticate and
        // refresh an initially missing or unverified App Store app transaction.
        guard let result = try? await AppTransaction.shared else { return nil }
        return Self.verifiedEnvironment(result)
    }

    func refreshAppEnvironment() async throws -> ApplePurchaseEnvironment? {
        do {
            return Self.verifiedEnvironment(try await AppTransaction.refresh())
        } catch StoreKitError.userCancelled {
            throw CancellationError()
        }
    }

    private static func verifiedEnvironment(_ result: VerificationResult<AppTransaction>) -> ApplePurchaseEnvironment? {
        guard case .verified(let app) = result else { return nil }
        switch app.environment {
        case .production: return .production
        case .sandbox: return .sandbox
        default: return nil
        }
    }

    nonisolated func purchaseIntents() -> AsyncStream<String> {
        AsyncStream { continuation in
            let task = Task {
                for await intent in PurchaseIntent.intents {
                    guard !Task.isCancelled else { break }
                    if await retainPurchaseIntent(intent) { continuation.yield(intent.product.id) }
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    private func retainPurchaseIntent(_ intent: PurchaseIntent) -> Bool {
        guard intent.product.id == RilloraStoreKitCatalog.familyAnnualProductID,
              intent.product.type == .autoRenewable,
              intent.product.subscription?.subscriptionGroupID == expectedSubscriptionGroupID else { return false }
        intendedProductsByID[intent.product.id] = intent.product
        productsByID[intent.product.id] = intent.product
        return true
    }

    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        let products = try await Product.products(for: identifiers)
        let validProducts = products.filter {
            identifiers.contains($0.id)
                && $0.type == .autoRenewable
                && $0.subscription?.subscriptionGroupID
                    == expectedSubscriptionGroupID
        }
        // Preserve the actual Product supplied by PurchaseIntent. The existing
        // server/StoreKit amount comparison still requires a current reviewed price.
        let selectedProducts = validProducts.map { intendedProductsByID[$0.id] ?? $0 }
        productsByID = Dictionary(uniqueKeysWithValues: selectedProducts.map { ($0.id, $0) })
        return selectedProducts
            .map(Self.snapshot)
            .sorted { lhs, rhs in
                (RilloraStoreKitCatalog.billingInterval(for: lhs.productID) ?? lhs.productID)
                    < (RilloraStoreKitCatalog.billingInterval(for: rhs.productID) ?? rhs.productID)
            }
    }

    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        await transactionSnapshot(Transaction.currentEntitlements, identifiers: identifiers)
    }

    func unfinishedTransactions(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        await transactionSnapshot(Transaction.unfinished, identifiers: identifiers)
    }

    private func transactionSnapshot(_ sequence: Transaction.Transactions,
                                     identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        var transactions: [StoreKitTransactionEvidence] = []
        var containsUnverifiedTransaction = false
        for await result in sequence {
            let productID = result.unsafePayloadValue.productID
            guard identifiers.contains(productID) else { continue }
            switch result {
            case .verified(let transaction):
                guard transaction.subscriptionGroupID == expectedSubscriptionGroupID else {
                    continue
                }
                transactions.append(retain(transaction, signedTransaction: result.jwsRepresentation))
            case .unverified:
                containsUnverifiedTransaction = true
            }
        }
        return StoreKitEntitlementSnapshot(
            transactions: transactions.sorted { $0.productID < $1.productID },
            containsUnverifiedTransaction: containsUnverifiedTransaction
        )
    }

    func subscriptionStatuses(
        identifiers: Set<String>
    ) async -> StoreKitSubscriptionStatusSnapshot {
        do {
            let statuses = try await Product.SubscriptionInfo.status(
                for: expectedSubscriptionGroupID
            )
            for status in statuses {
                if case .verified(let transaction) = status.transaction,
                   transaction.subscriptionGroupID == expectedSubscriptionGroupID {
                    transactionsAwaitingFinish[transaction.id] = transaction
                }
            }
            return Self.subscriptionSnapshot(
                statuses,
                identifiers: identifiers,
                expectedSubscriptionGroupID: expectedSubscriptionGroupID
            )
        } catch {
            return StoreKitSubscriptionStatusSnapshot(
                statuses: [],
                containsUnverifiedStatus: false,
                loadFailed: true
            )
        }
    }

    func purchase(
        productID: String,
        appAccountToken: UUID,
        expectedStorefrontCountryCode: String?,
        expectedProduct: StoreKitProductSnapshot?
    ) async throws -> StoreKitPurchaseOutcome {
        if let expectedStorefrontCountryCode,
           await Storefront.current?.countryCode != expectedStorefrontCountryCode {
            return .quoteChanged
        }
        // The UI quote may predate account authentication or a server round trip.
        // Never open the sheet with a cached Product from a different quote.
        guard let product = try await Product.products(for: [productID]).first,
              product.type == .autoRenewable,
              product.subscription?.subscriptionGroupID == expectedSubscriptionGroupID else {
            return .quoteChanged
        }
        if let expectedProduct {
            let fresh = Self.snapshot(product)
            guard expectedProduct.productID == productID,
                  let amount = expectedProduct.priceMilliunits,
                  let currency = expectedProduct.currencyCode,
                  fresh.priceMilliunits == amount, fresh.currencyCode == currency,
                  fresh.oneYearSubscription == expectedProduct.oneYearSubscription else {
                return .quoteChanged
            }
        }
        if let expectedStorefrontCountryCode,
           await Storefront.current?.countryCode != expectedStorefrontCountryCode {
            return .quoteChanged
        }
        productsByID[productID] = product

        var options: Set<Product.PurchaseOption> = [.appAccountToken(appAccountToken)]
        if expectedStorefrontCountryCode != nil {
            // Any change after the quote requires a new displayed price and consent.
            options.insert(.onStorefrontChange { _ in false })
        }

        switch try await product.purchase(options: options) {
        case .pending:
            return .pending
        case .userCancelled:
            if let expectedStorefrontCountryCode,
               await Storefront.current?.countryCode != expectedStorefrontCountryCode {
                return .quoteChanged
            }
            return .userCancelled
        case .success(let result):
            switch result {
            case .verified(let transaction):
                transactionsAwaitingFinish[transaction.id] = transaction
                return .verified(
                    Self.evidence(transaction, signedTransaction: result.jwsRepresentation)
                )
            case .unverified:
                return .unverified
            }
        @unknown default:
            throw StoreKitClientError.unexpectedPurchaseResult
        }
    }

    nonisolated func transactionUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitTransactionUpdate> {
        AsyncStream { continuation in
            let task = Task {
                for await result in Transaction.unfinished {
                    guard !Task.isCancelled else { break }
                    if let update = await retainedUpdate(result, identifiers: identifiers) { continuation.yield(update) }
                }
                for await result in Transaction.updates {
                    guard !Task.isCancelled else { break }
                    if let update = await retainedUpdate(result, identifiers: identifiers) { continuation.yield(update) }
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    private func retainedUpdate(_ result: VerificationResult<Transaction>, identifiers: Set<String>) -> StoreKitTransactionUpdate? {
        let productID = result.unsafePayloadValue.productID
        guard identifiers.contains(productID) else { return nil }
        switch result {
        case .verified(let transaction):
            guard transaction.subscriptionGroupID == expectedSubscriptionGroupID else { return nil }
            return .verified(retain(transaction, signedTransaction: result.jwsRepresentation))
        case .unverified: return .unverified(productID: productID)
        }
    }

    nonisolated func subscriptionStatusUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> {
        AsyncStream { continuation in
            let task = Task {
                for await update in Product.SubscriptionInfo.Status.all {
                    guard !Task.isCancelled else { break }
                    guard update.groupID == expectedSubscriptionGroupID else {
                        continue
                    }
                    continuation.yield(
                        Self.subscriptionSnapshot(
                            update.statuses,
                            identifiers: identifiers,
                            expectedSubscriptionGroupID: expectedSubscriptionGroupID
                        )
                    )
                }
                continuation.finish()
            }
            continuation.onTermination = { _ in task.cancel() }
        }
    }

    func finish(transactionID: UInt64) async {
        guard let transaction = transactionsAwaitingFinish.removeValue(forKey: transactionID) else {
            return
        }
        await transaction.finish()
    }

    func sync() async throws {
        try await AppStore.sync()
    }

    private func retain(
        _ transaction: Transaction,
        signedTransaction: String
    ) -> StoreKitTransactionEvidence {
        transactionsAwaitingFinish[transaction.id] = transaction
        return Self.evidence(transaction, signedTransaction: signedTransaction)
    }

    private static func snapshot(_ product: Product) -> StoreKitProductSnapshot {
        let milliunits = product.price * 1000
        let integer = NSDecimalNumber(decimal: milliunits).int64Value
        let exactPrice = Decimal(integer) == milliunits && integer > 0 && integer <= 9_007_199_254_740_991 ? Int(integer) : nil
        return StoreKitProductSnapshot(
            productID: product.id,
            displayName: product.displayName,
            description: product.description,
            displayPrice: product.displayPrice,
            subscriptionGroupID: product.subscription?.subscriptionGroupID ?? "",
            priceMilliunits: exactPrice,
            currencyCode: product.priceFormatStyle.currencyCode,
            oneYearSubscription: product.subscription?.subscriptionPeriod.unit == .year
                && product.subscription?.subscriptionPeriod.value == 1
        )
    }

    private static func evidence(
        _ transaction: Transaction,
        signedTransaction: String
    ) -> StoreKitTransactionEvidence {
        StoreKitTransactionEvidence(
            transactionID: transaction.id,
            originalTransactionID: transaction.originalID,
            productID: transaction.productID,
            subscriptionGroupID: transaction.subscriptionGroupID,
            appAccountToken: transaction.appAccountToken,
            environment: transaction.environment.rawValue,
            storefrontCountryCode: transaction.storefront.countryCode,
            purchaseDate: transaction.purchaseDate,
            expirationDate: transaction.expirationDate,
            revocationDate: transaction.revocationDate,
            transactionReason: transaction.reason.rawValue,
            signedTransaction: signedTransaction,
            isXcodeEnvironment: transaction.environment == .xcode
        )
    }

    private static func subscriptionSnapshot(
        _ statuses: [Product.SubscriptionInfo.Status],
        identifiers: Set<String>,
        expectedSubscriptionGroupID: String
    ) -> StoreKitSubscriptionStatusSnapshot {
        var verifiedStatuses: [StoreKitSubscriptionStatusEvidence] = []
        var containsUnverifiedStatus = false

        for status in statuses {
            let productID = status.transaction.unsafePayloadValue.productID
            guard identifiers.contains(productID) else { continue }

            switch (status.transaction, status.renewalInfo) {
            case (.verified(let transaction), .verified(let renewalInfo)):
                guard transaction.subscriptionGroupID == expectedSubscriptionGroupID else {
                    continue
                }
                verifiedStatuses.append(
                    StoreKitSubscriptionStatusEvidence(
                        transaction: evidence(
                            transaction,
                            signedTransaction: status.transaction.jwsRepresentation
                        ),
                        state: subscriptionState(status.state),
                        willAutoRenew: renewalInfo.willAutoRenew,
                        isInBillingRetry: renewalInfo.isInBillingRetry,
                        gracePeriodExpirationDate: renewalInfo.gracePeriodExpirationDate,
                        signedRenewalInfo: status.renewalInfo.jwsRepresentation
                    )
                )
            default:
                containsUnverifiedStatus = true
            }
        }

        return StoreKitSubscriptionStatusSnapshot(
            statuses: verifiedStatuses.sorted {
                ($0.transaction.productID, $0.transaction.transactionID)
                    < ($1.transaction.productID, $1.transaction.transactionID)
            },
            containsUnverifiedStatus: containsUnverifiedStatus,
            loadFailed: false
        )
    }

    private static func subscriptionState(
        _ state: Product.SubscriptionInfo.RenewalState
    ) -> StoreKitSubscriptionState {
        switch state {
        case .subscribed: .subscribed
        case .expired: .expired
        case .inBillingRetryPeriod: .inBillingRetryPeriod
        case .inGracePeriod: .inGracePeriod
        case .revoked: .revoked
        default: .unknown
        }
    }
}

enum StoreKitClientError: LocalizedError {
    case productUnavailable
    case unexpectedPurchaseResult

    var errorDescription: String? {
        switch self {
        case .productUnavailable:
            String(localized: "The selected StoreKit product is unavailable.")
        case .unexpectedPurchaseResult:
            String(localized: "StoreKit returned an unsupported purchase result.")
        }
    }
}

struct UnavailableStoreKitClient: StoreKitPurchasing {
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        throw StoreKitClientError.productUnavailable
    }

    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        StoreKitEntitlementSnapshot(
            transactions: [],
            containsUnverifiedTransaction: false
        )
    }

    func subscriptionStatuses(
        identifiers: Set<String>
    ) async -> StoreKitSubscriptionStatusSnapshot {
        .empty
    }

    func purchase(
        productID: String,
        appAccountToken: UUID,
        expectedStorefrontCountryCode: String?,
        expectedProduct: StoreKitProductSnapshot?
    ) async throws -> StoreKitPurchaseOutcome {
        throw StoreKitClientError.productUnavailable
    }

    func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate> {
        AsyncStream { continuation in continuation.finish() }
    }

    func subscriptionStatusUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> {
        AsyncStream { continuation in continuation.finish() }
    }

    func finish(transactionID: UInt64) async {}

    func sync() async throws {
        throw StoreKitClientError.productUnavailable
    }
}
