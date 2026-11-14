import Foundation
import Observation

/// Shared purchase flow with a verified distribution environment; diagnostics remain separate.
@MainActor @Observable
final class ApplePurchaseCoordinator {
    private(set) var environment: ApplePurchaseEnvironment?
    private(set) var quote: AppleQuoteResponse?
    private(set) var product: StoreKitProductSnapshot?
    /// Apple's current catalog price can be shown even when a new purchase is not allowed.
    private(set) var catalogProduct: StoreKitProductSnapshot?
    private(set) var isLoadingQuote = false
    private(set) var pending: ApplePendingPurchase?
    private(set) var busy = false
    private(set) var purchaseBlockedByAccount = false
    private(set) var message: String?
    var onReconciled: (@MainActor @Sendable () async -> Void)?
    private let service: any ApplePurchaseServing
    private let client: any StoreKitPurchasing
    private let storefront: any CommerceStorefrontProviding
    private let serviceMarket: String
    private var owner: UUID?
    private var ownedAppAccountTokens: Set<UUID> = []
    private var revision = 0
    private var quoteRevision = 0
    private var processing: [UInt64: Int] = [:]

    init(service: any ApplePurchaseServing, client: any StoreKitPurchasing,
         storefront: any CommerceStorefrontProviding, serviceMarket: String) {
        self.service = service; self.client = client; self.storefront = storefront; self.serviceMarket = serviceMarket
    }

    func start(owner: UUID) async {
        reset()
        self.owner = owner
        ownedAppAccountTokens = [owner] // Previously bound UUID-era purchases.
        let generation = revision
        let verifiedEnvironment = await client.verifiedAppEnvironment()
        guard generation == revision, !Task.isCancelled else { return }
        environment = verifiedEnvironment
        async let listener: Void = observeTransactions(generation: generation)
        await refreshQuote()
        await restore(synchronize: false)
        await listener
    }

    func reset() {
        revision += 1; quoteRevision += 1
        owner = nil; quote = nil; product = nil; catalogProduct = nil; pending = nil
        ownedAppAccountTokens = []
        isLoadingQuote = false
        busy = false; purchaseBlockedByAccount = false; message = nil; processing = [:]; environment = nil
    }

    private func rememberOwnedTokens(_ tokens: [UUID]?) throws {
        guard let tokens else { return } // Compatibility with the legacy UUID-era API.
        guard tokens.count <= 1000 else { throw RilloraAPIError.invalidResponse }
        ownedAppAccountTokens.formUnion(tokens)
    }

    func refreshQuote() async {
        let generation = revision
        guard owner != nil else { return }
        quoteRevision += 1
        let request = quoteRevision
        quote = nil; product = nil; catalogProduct = nil
        isLoadingQuote = true
        defer {
            if generation == revision, request == quoteRevision { isLoadingQuote = false }
        }
        do {
            let available = try await client.loadProducts(identifiers: RilloraStoreKitCatalog.purchasableFamilyProductIDs)
            guard generation == revision, request == quoteRevision, !Task.isCancelled,
                  available.count == 1, let match = available.first,
                  match.productID == RilloraStoreKitCatalog.familyAnnualProductID,
                  match.subscriptionGroupID == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
                  match.oneYearSubscription, let amount = match.priceMilliunits, amount > 0,
                  match.currencyCode?.range(of: "^[A-Z]{3}$", options: .regularExpression) != nil else { return }
            catalogProduct = match
            if environment == nil {
                let verified = await client.verifiedAppEnvironment()
                guard generation == revision, request == quoteRevision else { return }
                environment = verified
            }
            guard let environment else { return }
            let existing = try? await service.pendingApplePurchase(environment: environment)
            guard generation == revision, request == quoteRevision else { return }
            pending = existing?.purchase
            try rememberOwnedTokens(existing?.appAccountTokens)
            guard let country = await storefront.currentCountryCode() else { return }
            let response = try await service.fetchAppleQuote(serviceMarket: serviceMarket, storefront: country, environment: environment)
            guard generation == revision, request == quoteRevision, !Task.isCancelled, response.isValid(for: environment),
                  response.quote.serviceMarketCode == serviceMarket,
                  response.quote.storefrontCountryCode == country,
                  matches(match, response.quote) else { return }
            quote = response; product = match
        } catch {
            if generation == revision, request == quoteRevision { quote = nil; product = nil }
        }
    }

    /// Called only by the subscription button beside the price, renewal disclosure and terms.
    func purchase(accepting displayedQuote: AppleQuoteResponse?) async {
        guard !busy, let expected = displayedQuote, let owner, let environment else { return }
        let generation = revision
        busy = true; message = nil
        defer { if generation == revision { busy = false } }
        do {
            guard quote == expected else {
                message = String(localized: "The price changed or is unavailable. Review it before subscribing."); return
            }
            // Re-load both prices before preparing. A changed price needs a fresh
            // deliberate consent action, even when the StoreKit sheet would confirm it.
            await refreshQuote()
            guard generation == revision, !Task.isCancelled else { return }
            guard let current = quote, current == expected, let quotedProduct = product else {
                message = String(localized: "The price changed or is unavailable. Review it before subscribing."); return
            }
            if pending?.state == "pending" { message = String(localized: "Your purchase is waiting for Apple. Check it again shortly."); return }
            // Avoid opening Apple's payment/authentication sheet for a purchase
            // already owned by another app account. These reads never call sync.
            async let currentRead = client.currentEntitlements(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            async let unfinishedRead = client.unfinishedTransactions(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            let (currentHistory, unfinished) = await (currentRead, unfinishedRead)
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            let existingHistory = currentHistory.transactions + unfinished.transactions
            let ownedHistory = existingHistory.filter { isRelevant($0, environment: environment) && isOwned($0) }
            if !ownedHistory.isEmpty {
                var seen = Set<UInt64>()
                for evidence in ownedHistory where seen.insert(evidence.transactionID).inserted {
                    await accept(evidence, generation: generation)
                }
                guard generation == revision else { return }
                let existing = try await service.pendingApplePurchase(environment: environment).purchase
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                pending = existing
                return
            }
            if let conflict = accountConflict(in: existingHistory, environment: environment) {
                purchaseBlockedByAccount = true; message = conflict; return
            }
            purchaseBlockedByAccount = false
            guard !currentHistory.containsUnverifiedTransaction, !unfinished.containsUnverifiedTransaction else {
                message = String(localized: "Apple purchase history could not be fully checked. Try again shortly."); return
            }
            // An expired subscription can retain its original transaction owner.
            // Check that history before opening a new charge, but never on a pending check.
            let statuses = await client.subscriptionStatuses(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            if let conflict = accountConflict(in: statuses.statuses.map(\.transaction), environment: environment) {
                purchaseBlockedByAccount = true; message = conflict; return
            }
            guard !statuses.containsUnverifiedStatus, !statuses.loadFailed else {
                message = String(localized: "Apple purchase history could not be fully checked. Try again shortly."); return
            }
            let preparation = ApplePurchasePreparation(quote: current.quote,
                consent: ApplePurchaseConsent(terms: current.purchaseTerms, accepted: true), expectedAppAccountToken: owner)
            let prepared = try await service.prepareApplePurchase(preparation, nonce: pending?.nonce ?? UUID(), environment: environment)
            guard generation == revision, owner == self.owner, prepared.isValid(for: environment) else { return }
            ownedAppAccountTokens.insert(prepared.appAccountToken)
            let started = try await service.changeApplePurchase(prepared.orderReference, action: "start", environment: environment)
            guard generation == revision, started.state == "started", !Task.isCancelled else { return }
            let outcome = try await client.purchase(productID: current.quote.productId, appAccountToken: prepared.appAccountToken,
                expectedStorefrontCountryCode: current.quote.storefrontCountryCode, expectedProduct: quotedProduct)
            guard generation == revision else { return }
            switch outcome {
            case .verified(let evidence): await accept(evidence, generation: generation, reportForeignOwner: true)
            case .pending:
                _ = try await service.changeApplePurchase(prepared.orderReference, action: "pending", environment: environment)
                guard generation == revision else { return }
                message = String(localized: "Waiting for Apple to approve your purchase.")
            case .userCancelled:
                _ = try await service.changeApplePurchase(prepared.orderReference, action: "cancel", environment: environment)
                guard generation == revision else { return }
                await refreshQuote()
                guard generation == revision, !Task.isCancelled else { return }
                message = quote == current ? nil : String(localized: "The price changed or is unavailable. Review it before subscribing.")
            case .quoteChanged:
                _ = try await service.changeApplePurchase(prepared.orderReference, action: "cancel", environment: environment)
                guard generation == revision, !Task.isCancelled else { return }
                await refreshQuote()
                guard generation == revision, !Task.isCancelled else { return }
                message = String(localized: "The price changed or is unavailable. Review it before subscribing.")
            case .unverified:
                message = String(localized: "Apple could not verify this purchase. Restore purchases before trying again.")
            }
            let existing = try await service.pendingApplePurchase(environment: environment).purchase
            guard generation == revision else { return }
            pending = existing
        } catch is CancellationError { return }
        catch {
            if generation == revision { message = error.localizedDescription }
        }
    }

    func restore(synchronize: Bool = true) async {
        await reconcile(synchronize ? .restore : .automatic)
    }

    func checkPendingPurchase() async {
        await reconcile(.pendingCheck)
    }

    private enum ReconciliationIntent { case automatic, restore, pendingCheck }

    private func reconcile(_ intent: ReconciliationIntent) async {
        guard let owner, !busy else { return }
        let generation = revision
        let reportsStatus = intent != .automatic
        busy = true
        if reportsStatus { message = nil }
        defer { if generation == revision { busy = false } }
        do {
            if environment == nil {
                await refreshQuote()
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                if environment == nil && intent == .restore {
                    let refreshed = try await client.refreshAppEnvironment()
                    guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                    environment = refreshed
                    if refreshed != nil { await refreshQuote() }
                }
            }
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            guard let environment else {
                if reportsStatus { message = String(localized: "Apple purchases are temporarily unavailable. Please try again.") }
                return
            }
            async let entitlementRead = client.currentEntitlements(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            async let stateRead = service.pendingApplePurchase(environment: environment)
            let (initialEntitlements, purchaseState) = try await (entitlementRead, stateRead)
            var entitlements = initialEntitlements
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            try rememberOwnedTokens(purchaseState.appAccountTokens)
            pending = purchaseState.purchase
            let checkingPending = intent == .pendingCheck || pending != nil
            let currentConflict = accountConflict(in: entitlements.transactions, environment: environment)
            purchaseBlockedByAccount = currentConflict != nil
            let hasOwnedCurrent = entitlements.transactions.contains { isRelevant($0, environment: environment) && isOwned($0) }
            if !checkingPending, !hasOwnedCurrent, let currentConflict {
                message = currentConflict; return
            }
            let records: [StoreKitTransactionEvidence]
            let complete: Bool
            if checkingPending {
                // Pending checks use current/unfinished signed transactions. They
                // neither force an Apple login nor re-query the full subscription history.
                let unfinished = await client.unfinishedTransactions(identifiers: RilloraStoreKitCatalog.familyProductIDs)
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                records = entitlements.transactions + unfinished.transactions
                complete = !entitlements.containsUnverifiedTransaction && !unfinished.containsUnverifiedTransaction
                if let conflict = accountConflict(in: records, environment: environment) {
                    purchaseBlockedByAccount = true
                    message = conflict
                }
            } else {
                var statuses = await client.subscriptionStatuses(identifiers: RilloraStoreKitCatalog.familyProductIDs)
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                let knownHistory = entitlements.transactions + statuses.statuses.map(\.transaction)
                if intent == .restore && !knownHistory.contains(where: { isRelevant($0, environment: environment) }) {
                    try await client.sync()
                    async let currentRead = client.currentEntitlements(identifiers: RilloraStoreKitCatalog.familyProductIDs)
                    async let statusRead = client.subscriptionStatuses(identifiers: RilloraStoreKitCatalog.familyProductIDs)
                    (entitlements, statuses) = await (currentRead, statusRead)
                }
                records = entitlements.transactions + statuses.statuses.map(\.transaction)
                complete = !entitlements.containsUnverifiedTransaction && !statuses.containsUnverifiedStatus && !statuses.loadFailed
            }
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            var ids = Set<UInt64>()
            var owned = 0
            for evidence in records where ids.insert(evidence.transactionID).inserted {
                guard generation == revision else { return }
                if evidence.appAccountToken.map(ownedAppAccountTokens.contains) == true { owned += 1; await accept(evidence, generation: generation) }
            }
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            if reportsStatus && !complete && !purchaseBlockedByAccount { message = String(localized: "Apple purchase history could not be fully checked. Try again shortly.") }
            if reportsStatus && complete && ids.isEmpty {
                message = checkingPending && pending != nil
                    ? String(localized: "Apple has not returned a matching purchase yet. Check again shortly; do not start another purchase.")
                    : String(localized: "No Rillora purchases were found for this Apple account.")
            }
            if complete && !ids.isEmpty && owned == 0 {
                if let conflict = accountConflict(in: records, environment: environment) {
                    purchaseBlockedByAccount = true; message = conflict
                } else if reportsStatus {
                    message = String(localized: "Apple purchase history could not be fully checked. Try again shortly.")
                }
            }
            if owned > 0 {
                let existing = try await service.pendingApplePurchase(environment: environment).purchase
                guard generation == revision else { return }
                pending = existing
            }
        } catch is CancellationError { return }
        catch { if generation == revision && reportsStatus { message = error.localizedDescription } }
    }

    private func observeTransactions(generation: Int) async {
        for await update in client.transactionUpdates(identifiers: RilloraStoreKitCatalog.familyProductIDs) {
            guard generation == revision, !Task.isCancelled else { return }
            switch update {
            case .verified(let evidence): await accept(evidence, generation: generation)
            case .unverified: message = String(localized: "Apple could not verify a purchase. It has not changed your access.")
            }
        }
    }

    private func accept(_ evidence: StoreKitTransactionEvidence, generation: Int, reportForeignOwner: Bool = false) async {
        guard let environment else { return }
        if generation == revision, reportForeignOwner,
           let conflict = accountConflict(in: [evidence], environment: environment) {
            purchaseBlockedByAccount = true; message = conflict; return
        }
        if generation == revision, evidence.appAccountToken.map(ownedAppAccountTokens.contains) == true, !environment.matches(transaction: evidence) {
            message = String(localized: "This purchase belongs to a different Apple environment."); return
        }
        guard generation == revision, processing[evidence.transactionID] != generation,
              let owner, evidence.appAccountToken.map(ownedAppAccountTokens.contains) == true,
              evidence.subscriptionGroupID == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
              RilloraStoreKitCatalog.familyProductIDs.contains(evidence.productID), !evidence.isXcodeEnvironment,
              environment.matches(transaction: evidence) else { return }
        processing[evidence.transactionID] = generation
        defer { if processing[evidence.transactionID] == generation { processing.removeValue(forKey: evidence.transactionID) } }
        do {
            let response = try await service.submitAppleTransaction(evidence, environment: environment)
            guard generation == revision, owner == self.owner, response.isValid(for: environment) else { return }
            guard response.result.finishAuthorized else {
                message = String(localized: "Your purchase is being checked. Restore purchases to check again."); return
            }
            await client.finish(transactionID: evidence.transactionID)
            guard generation == revision else { return }
            purchaseBlockedByAccount = false
            message = String(localized: "Your Apple purchase status is up to date.")
            await onReconciled?()
            // A background receipt can complete an order while no button task is
            // running. Refresh that state directly, without invalidating the price.
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            if let state = try? await service.pendingApplePurchase(environment: environment) {
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                try rememberOwnedTokens(state.appAccountTokens)
                pending = state.purchase
            }
        } catch RilloraAPIError.server(_, "apple_purchase_owner_conflict", _, _) {
            if generation == revision {
                purchaseBlockedByAccount = true
                message = String(localized: "Use the Rillora account originally used for this purchase.")
            }
        } catch { if generation == revision { message = String(localized: "Your purchase is saved by Apple. Restore purchases to finish checking your access.") } }
    }

    private func isOwned(_ evidence: StoreKitTransactionEvidence) -> Bool {
        evidence.appAccountToken.map(ownedAppAccountTokens.contains) == true
    }

    private func isRelevant(_ evidence: StoreKitTransactionEvidence, environment: ApplePurchaseEnvironment) -> Bool {
        !evidence.isXcodeEnvironment && environment.matches(transaction: evidence)
            && evidence.subscriptionGroupID == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
            && RilloraStoreKitCatalog.familyProductIDs.contains(evidence.productID)
    }

    private func accountConflict(in records: [StoreKitTransactionEvidence], environment: ApplePurchaseEnvironment) -> String? {
        guard let unowned = records.first(where: { isRelevant($0, environment: environment) && !isOwned($0) }) else { return nil }
        return unowned.appAccountToken == nil
            ? String(localized: "Apple could not confirm which Rillora account owns this purchase. Contact support before subscribing again.")
            : String(localized: "Use the Rillora account originally used for this purchase.")
    }

    private func matches(_ product: StoreKitProductSnapshot, _ quote: ApplePurchaseQuote) -> Bool {
        product.productID == quote.productId && product.oneYearSubscription
            && product.subscriptionGroupID == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
            && product.priceMilliunits == quote.priceMilliunits && product.currencyCode == quote.currency
    }
}
