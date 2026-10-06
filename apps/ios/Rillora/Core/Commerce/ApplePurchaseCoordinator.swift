import Foundation
import Observation

/// Shared purchase flow with a verified distribution environment; diagnostics remain separate.
@MainActor @Observable
final class ApplePurchaseCoordinator {
    private(set) var environment: ApplePurchaseEnvironment?
    private(set) var quote: AppleQuoteResponse?
    private(set) var product: StoreKitProductSnapshot?
    private(set) var pending: ApplePendingPurchase?
    private(set) var busy = false
    private(set) var message: String?
    var onReconciled: (@MainActor @Sendable () async -> Void)?
    private let service: any ApplePurchaseServing
    private let client: any StoreKitPurchasing
    private let storefront: any CommerceStorefrontProviding
    private let serviceMarket: String
    private var owner: UUID?
    private var revision = 0
    private var processing: [UInt64: Int] = [:]

    init(service: any ApplePurchaseServing, client: any StoreKitPurchasing,
         storefront: any CommerceStorefrontProviding, serviceMarket: String) {
        self.service = service; self.client = client; self.storefront = storefront; self.serviceMarket = serviceMarket
    }

    func start(owner: UUID) async {
        reset()
        self.owner = owner
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
        revision += 1; owner = nil; quote = nil; product = nil; pending = nil
        busy = false; message = nil; processing = [:]; environment = nil
    }

    func refreshQuote() async {
        let generation = revision
        guard owner != nil else { return }
        quote = nil; product = nil
        if environment == nil {
            let verified = await client.verifiedAppEnvironment()
            guard generation == revision else { return }
            environment = verified
        }
        guard let environment else { return }
        let existing = try? await service.pendingApplePurchase(environment: environment)
        guard generation == revision else { return }
        pending = existing?.purchase
        do {
            guard let country = await storefront.currentCountryCode() else { return }
            async let current = service.fetchAppleQuote(serviceMarket: serviceMarket, storefront: country, environment: environment)
            async let products = client.loadProducts(identifiers: RilloraStoreKitCatalog.purchasableFamilyProductIDs)
            let (response, available) = try await (current, products)
            guard generation == revision, !Task.isCancelled, response.isValid(for: environment),
                  response.quote.serviceMarketCode == serviceMarket,
                  response.quote.storefrontCountryCode == country,
                  available.count == 1, let match = available.first, matches(match, response.quote) else { return }
            quote = response; product = match
        } catch {
            if generation == revision { quote = nil; product = nil }
        }
    }

    func purchase(acceptedTerms: Bool) async {
        guard !busy, acceptedTerms, let expected = quote, let owner, let environment else { return }
        let generation = revision
        busy = true; message = nil
        defer { if generation == revision { busy = false } }
        do {
            // Re-load both prices before preparing. A changed price needs a fresh
            // deliberate consent action, even when the StoreKit sheet would confirm it.
            await refreshQuote()
            guard generation == revision, !Task.isCancelled else { return }
            guard let current = quote, current == expected, product != nil else {
                message = String(localized: "The price changed or is unavailable. Review it before subscribing."); return
            }
            if pending?.state == "pending" { message = String(localized: "Your purchase is waiting for Apple. Check it again shortly."); return }
            let preparation = ApplePurchasePreparation(quote: current.quote,
                consent: ApplePurchaseConsent(terms: current.purchaseTerms, accepted: acceptedTerms), expectedAppAccountToken: owner)
            let prepared = try await service.prepareApplePurchase(preparation, nonce: pending?.nonce ?? UUID(), environment: environment)
            guard generation == revision, prepared.isValid(for: environment), prepared.appAccountToken == owner else { return }
            let started = try await service.changeApplePurchase(prepared.orderReference, action: "start", environment: environment)
            guard generation == revision, started.state == "started", !Task.isCancelled else { return }
            let outcome = try await client.purchase(productID: current.quote.productId, appAccountToken: owner,
                expectedStorefrontCountryCode: current.quote.storefrontCountryCode)
            guard generation == revision else { return }
            switch outcome {
            case .verified(let evidence): await accept(evidence, generation: generation)
            case .pending:
                _ = try await service.changeApplePurchase(prepared.orderReference, action: "pending", environment: environment)
                guard generation == revision else { return }
                message = String(localized: "Waiting for Apple to approve your purchase.")
            case .userCancelled:
                _ = try await service.changeApplePurchase(prepared.orderReference, action: "cancel", environment: environment)
                guard generation == revision else { return }
                message = nil
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
        guard let owner, !busy else { return }
        let generation = revision
        busy = true
        if synchronize { message = nil }
        defer { if generation == revision { busy = false } }
        do {
            if environment == nil {
                await refreshQuote()
                guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                if environment == nil && synchronize {
                    let refreshed = try await client.refreshAppEnvironment()
                    guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
                    environment = refreshed
                    if refreshed != nil { await refreshQuote() }
                }
            }
            guard generation == revision, owner == self.owner, !Task.isCancelled else { return }
            guard let environment else {
                if synchronize { message = String(localized: "Apple purchases are temporarily unavailable. Please try again.") }
                return
            }
            if synchronize { try await client.sync() }
            let entitlements = await client.currentEntitlements(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            let statuses = await client.subscriptionStatuses(identifiers: RilloraStoreKitCatalog.familyProductIDs)
            guard generation == revision else { return }
            let complete = !entitlements.containsUnverifiedTransaction && !statuses.containsUnverifiedStatus && !statuses.loadFailed
            if !complete {
                if synchronize { message = String(localized: "Apple purchase history could not be fully checked. Try again shortly.") }
            }
            var ids = Set<UInt64>()
            var owned = 0
            for evidence in entitlements.transactions + statuses.statuses.map(\.transaction) where ids.insert(evidence.transactionID).inserted {
                guard generation == revision else { return }
                if evidence.appAccountToken == owner { owned += 1; await accept(evidence, generation: generation) }
            }
            if synchronize && complete && ids.isEmpty { message = String(localized: "No Rillora purchases were found for this Apple account.") }
            if synchronize && complete && !ids.isEmpty && owned == 0 { message = String(localized: "Use the Rillora account originally used for this purchase.") }
            let existing = try await service.pendingApplePurchase(environment: environment).purchase
            guard generation == revision else { return }
            pending = existing
        } catch is CancellationError { return }
        catch { if generation == revision && synchronize { message = error.localizedDescription } }
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

    private func accept(_ evidence: StoreKitTransactionEvidence, generation: Int) async {
        guard let environment else { return }
        if generation == revision, evidence.appAccountToken == owner, !environment.matches(transaction: evidence) {
            message = String(localized: "This purchase belongs to a different Apple environment."); return
        }
        guard generation == revision, processing[evidence.transactionID] != generation,
              let owner, evidence.appAccountToken == owner,
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
            message = String(localized: "Your Apple purchase status is up to date.")
            await onReconciled?()
        } catch { if generation == revision { message = String(localized: "Your purchase is saved by Apple. Restore purchases to finish checking your access.") } }
    }

    private func matches(_ product: StoreKitProductSnapshot, _ quote: ApplePurchaseQuote) -> Bool {
        product.productID == quote.productId && product.oneYearSubscription
            && product.subscriptionGroupID == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
            && product.priceMilliunits == quote.priceMilliunits && product.currencyCode == quote.currency
    }
}
