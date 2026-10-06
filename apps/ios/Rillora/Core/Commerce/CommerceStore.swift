import Foundation
import Observation

@MainActor
@Observable
final class CommerceStore {
    private(set) var status: CommerceStatus?
    private(set) var purchaseRoute: CommercePurchaseRouteResponse?
    private(set) var storefrontCountryCode: String?
    private(set) var storeKitProducts: [StoreKitProductSnapshot] = []
    private(set) var storeKitLocalTransactions: [StoreKitLocalTransactionRecord] = []
    private(set) var storeKitSandboxTransactions: [StoreKitLocalTransactionRecord] = []
    private(set) var storeKitSandboxServerStatus: String?
    private(set) var storeKitLocalEntitlements: [StoreKitLocalTransactionRecord] = []
    private(set) var storeKitLocalSubscriptionStatuses: [StoreKitLocalSubscriptionStatusRecord] = []
    private(set) var storeKitContainsUnverifiedEntitlement = false
    private(set) var storeKitContainsUnverifiedSubscriptionStatus = false
    private(set) var storeKitContainsMismatchedEntitlement = false
    private(set) var storeKitContainsMismatchedSubscriptionStatus = false
    private(set) var storeKitSubscriptionStatusLoadFailed = false
    private(set) var isStoreKitWorking = false
    private(set) var storeKitMessage: String?
    private(set) var isLoading = false
    private(set) var errorMessage: String?
    let storeKitTestEnvironment: RilloraStoreKitTestEnvironment
    let applePurchase: ApplePurchaseCoordinator?

    private let service: any CommerceServing
    private let storefrontProvider: any CommerceStorefrontProviding
    private let storeKitClient: any StoreKitPurchasing
    private let serviceMarketCode: String
    private let storeKitTestAppAccountToken: UUID?
    private var localAppAccountToken: UUID?
    private var pendingStoreKitSandboxTransaction: StoreKitTransactionEvidence?
    private var refreshRevision = 0
    private var lifecycleRevision = 0

    init(
        service: any CommerceServing,
        storefrontProvider: any CommerceStorefrontProviding,
        storeKitClient: any StoreKitPurchasing = UnavailableStoreKitClient(),
        storeKitTestEnvironment: RilloraStoreKitTestEnvironment = .disabled,
        storeKitTestAppAccountToken: UUID? = nil,
        serviceMarketCode: String,
        storeKitProductionEnabled: Bool = false
    ) {
        self.service = service
        self.storefrontProvider = storefrontProvider
        self.storeKitClient = storeKitClient
        self.storeKitTestEnvironment = storeKitTestEnvironment
        self.storeKitTestAppAccountToken = storeKitTestAppAccountToken
        self.serviceMarketCode = serviceMarketCode
        self.applePurchase = storeKitProductionEnabled && !storeKitTestEnvironment.isEnabled
            ? ApplePurchaseCoordinator(service: service, client: storeKitClient, storefront: storefrontProvider, serviceMarket: serviceMarketCode)
            : nil
        self.applePurchase?.onReconciled = { [weak self] in await self?.refresh() }
    }

    func purchaseIntents() -> AsyncStream<String> {
        guard applePurchase != nil else { return AsyncStream { $0.finish() } }
        return storeKitClient.purchaseIntents()
    }

    var storeKitLocalTestingEnabled: Bool {
        storeKitTestEnvironment == .xcodeLocal
    }

    var storeKitSandboxCatalogTestingEnabled: Bool {
        storeKitTestEnvironment.isAppStoreSandbox
    }

    var storeKitSandboxPurchaseTestingEnabled: Bool {
        storeKitTestEnvironment == .appStoreSandboxPurchase
    }

    var storeKitSandboxTransactionPending: Bool {
        pendingStoreKitSandboxTransaction != nil
    }

    var currentPlanLabel: String {
        guard let planCode = status?.currentAccess.planCode else { return String(localized: "View") }
        let label = switch planCode {
        case "free": String(localized: "Free")
        case "family": String(localized: "Family")
        default: planCode
        }
        return status?.validationOnly == true ? L10n.format("%1$@ · Test access", label) : label
    }

    var purchaseIsAvailable: Bool {
        status?.billingOpen == true
            && purchaseRoute?.purchaseRoute != "none"
            && purchaseRoute?.reason == "available"
    }

    func start(appAccountToken: UUID? = nil) async {
        guard !Task.isCancelled else { return }
        lifecycleRevision += 1
        let lifecycle = lifecycleRevision
        localAppAccountToken = appAccountToken
        await refresh()
        guard lifecycle == lifecycleRevision, !Task.isCancelled else { return }
        if storeKitTestEnvironment.isEnabled {
            await loadStoreKitProducts()
        }
        guard lifecycle == lifecycleRevision, !Task.isCancelled else { return }
        if storeKitLocalTestingEnabled {
            await refreshLocalStoreKitState()
        }
        guard lifecycle == lifecycleRevision, !Task.isCancelled else { return }

        async let storefrontUpdates: Void = observeStorefrontUpdates()
        async let transactionUpdates: Void = observeStoreKitTransactionUpdates()
        async let subscriptionStatusUpdates: Void = observeStoreKitSubscriptionStatusUpdates()
        async let productionUpdates: Void = startProductionPurchases(owner: appAccountToken, lifecycle: lifecycle)
        _ = await (storefrontUpdates, transactionUpdates, subscriptionStatusUpdates, productionUpdates)
    }

    private func startProductionPurchases(owner: UUID?, lifecycle: Int) async {
        guard lifecycle == lifecycleRevision, !Task.isCancelled else { return }
        if let owner { await applePurchase?.start(owner: owner) }
    }

    func startSandboxCatalog() async {
        guard storeKitSandboxCatalogTestingEnabled else { return }
        localAppAccountToken = storeKitTestAppAccountToken
        storefrontCountryCode = await storefrontProvider.currentCountryCode()
        isStoreKitWorking = true
        await loadStoreKitProducts()
        isStoreKitWorking = false

        async let storefrontUpdates: Void = observeSandboxStorefrontUpdates()
        async let transactionUpdates: Void = observeStoreKitTransactionUpdates()
        _ = await (storefrontUpdates, transactionUpdates)
    }

    private func observeSandboxStorefrontUpdates() async {
        for await countryCode in storefrontProvider.countryCodeUpdates() {
            guard !Task.isCancelled else { return }
            guard countryCode != storefrontCountryCode else { continue }
            storefrontCountryCode = countryCode
            isStoreKitWorking = true
            await loadStoreKitProducts()
            isStoreKitWorking = false
        }
    }

    private func observeStorefrontUpdates() async {
        for await countryCode in storefrontProvider.countryCodeUpdates() {
            guard !Task.isCancelled else { return }
            await applyStorefrontUpdate(countryCode)
        }
    }

    private func observeStoreKitTransactionUpdates() async {
        guard storeKitLocalTestingEnabled || storeKitSandboxPurchaseTestingEnabled else {
            return
        }
        for await update in storeKitClient.transactionUpdates(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        ) {
            guard !Task.isCancelled else { return }
            switch update {
            case .verified(let evidence):
                if storeKitLocalTestingEnabled {
                    await acceptLocalStoreKitTransaction(evidence)
                } else {
                    await acceptStoreKitSandboxTransaction(evidence)
                }
            case .unverified:
                storeKitMessage = String(localized: "StoreKit returned an unverified transaction. It was not recorded or finished.")
            }
        }
    }

    private func observeStoreKitSubscriptionStatusUpdates() async {
        guard storeKitLocalTestingEnabled else { return }
        for await snapshot in storeKitClient.subscriptionStatusUpdates(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        ) {
            guard !Task.isCancelled else { return }
            applyLocalStoreKitSubscriptionStatuses(snapshot)
            if let state = storeKitLocalSubscriptionStatuses.first?.state {
                storeKitMessage = L10n.format("Local subscription state: %1$@. Ordinary Rillora access is unchanged.", Self.subscriptionStateLabel(state))
            }
        }
    }

    func applyStorefrontUpdate(_ countryCode: String) async {
        guard countryCode != storefrontCountryCode else { return }
        await refresh(storefrontCountryCode: countryCode)
        if storeKitTestEnvironment.isEnabled {
            await loadStoreKitProducts()
        }
        if storeKitLocalTestingEnabled {
            await refreshLocalStoreKitState()
        }
    }

    func refresh() async {
        await refresh(storefrontCountryCode: nil)
    }

    func reset() {
        lifecycleRevision += 1
        refreshRevision += 1
        applePurchase?.reset()
        status = nil
        purchaseRoute = nil
        storefrontCountryCode = nil
        storeKitProducts = []
        storeKitLocalTransactions = []
        storeKitSandboxTransactions = []
        storeKitSandboxServerStatus = nil
        storeKitLocalEntitlements = []
        storeKitLocalSubscriptionStatuses = []
        storeKitContainsUnverifiedEntitlement = false
        storeKitContainsUnverifiedSubscriptionStatus = false
        storeKitContainsMismatchedEntitlement = false
        storeKitContainsMismatchedSubscriptionStatus = false
        storeKitSubscriptionStatusLoadFailed = false
        isStoreKitWorking = false
        storeKitMessage = nil
        localAppAccountToken = nil
        pendingStoreKitSandboxTransaction = nil
        isLoading = false
        errorMessage = nil
    }

    func purchaseLocalStoreKitProduct(productID: String) async {
        guard storeKitLocalTestingEnabled else { return }
        guard RilloraStoreKitCatalog.purchasableFamilyProductIDs.contains(productID),
              storeKitProducts.contains(where: { $0.productID == productID }) else {
            storeKitMessage = String(localized: "The selected local StoreKit product is not available.")
            return
        }
        guard let localAppAccountToken else {
            storeKitMessage = String(localized: "A signed-in Rillora account is required to bind the local transaction.")
            return
        }

        isStoreKitWorking = true
        storeKitMessage = nil
        defer { isStoreKitWorking = false }
        do {
            let outcome = try await storeKitClient.purchase(
                productID: productID,
                appAccountToken: localAppAccountToken,
                expectedStorefrontCountryCode: storefrontCountryCode,
                expectedProduct: storeKitProducts.first { $0.productID == productID }
            )
            switch outcome {
            case .verified(let evidence):
                await acceptLocalStoreKitTransaction(evidence)
            case .pending:
                storeKitMessage = String(localized: "The local StoreKit purchase is pending. No Rillora access changed.")
            case .userCancelled:
                storeKitMessage = String(localized: "The local StoreKit purchase was cancelled.")
            case .quoteChanged:
                storeKitMessage = String(localized: "The price changed or is unavailable. Review it before subscribing.")
            case .unverified:
                storeKitMessage = String(localized: "StoreKit returned an unverified purchase. It was not recorded or finished.")
            }
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = String(localized: "The local StoreKit purchase could not be completed. No Rillora access changed.")
        }
    }

    func purchaseStoreKitSandboxProduct(productID: String) async {
        guard storeKitSandboxPurchaseTestingEnabled else { return }
        guard RilloraStoreKitCatalog.purchasableFamilyProductIDs.contains(productID),
              storeKitProducts.contains(where: { $0.productID == productID }) else {
            storeKitMessage = String(localized: "The selected App Store Sandbox product is not available.")
            return
        }
        guard let localAppAccountToken else {
            storeKitMessage = String(localized: "The Sandbox purchase is missing its synthetic Rillora account binding.")
            return
        }

        isStoreKitWorking = true
        storeKitMessage = nil
        defer { isStoreKitWorking = false }
        do {
            let outcome = try await storeKitClient.purchase(
                productID: productID,
                appAccountToken: localAppAccountToken,
                expectedStorefrontCountryCode: storefrontCountryCode,
                expectedProduct: storeKitProducts.first { $0.productID == productID }
            )
            switch outcome {
            case .verified(let evidence):
                await acceptStoreKitSandboxTransaction(evidence)
            case .pending:
                storeKitMessage = String(localized: "The Sandbox purchase is pending. No Rillora access changed.")
            case .userCancelled:
                storeKitMessage = String(localized: "The Sandbox purchase was cancelled.")
            case .quoteChanged:
                storeKitMessage = String(localized: "The price changed or is unavailable. Review it before subscribing.")
            case .unverified:
                storeKitMessage = String(localized: "Apple returned an unverified Sandbox purchase. It was not submitted or finished.")
            }
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = String(localized: "The Sandbox purchase could not be completed. No Rillora access changed.")
        }
    }

    func retryStoreKitSandboxServerVerification() async {
        guard storeKitSandboxPurchaseTestingEnabled,
              let pendingStoreKitSandboxTransaction else { return }
        isStoreKitWorking = true
        defer { isStoreKitWorking = false }
        await acceptStoreKitSandboxTransaction(pendingStoreKitSandboxTransaction)
    }

    func restoreLocalStoreKitPurchases() async {
        guard storeKitLocalTestingEnabled else { return }
        isStoreKitWorking = true
        storeKitMessage = nil
        defer { isStoreKitWorking = false }
        do {
            try await storeKitClient.sync()
            await refreshLocalStoreKitState()
            storeKitMessage = String(localized: "Local StoreKit history was refreshed. Ordinary Rillora access is still server-owned.")
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = String(localized: "Local StoreKit history could not be refreshed. No Rillora access changed.")
        }
    }

    private func loadStoreKitProducts() async {
        do {
            let products = try await storeKitClient.loadProducts(
                identifiers: RilloraStoreKitCatalog.purchasableFamilyProductIDs
            )
            guard let expectedSubscriptionGroupID = storeKitTestEnvironment.subscriptionGroupID,
                  Set(products.map(\.productID)) == RilloraStoreKitCatalog.purchasableFamilyProductIDs,
                  products.allSatisfy({
                      $0.subscriptionGroupID == expectedSubscriptionGroupID
                  }) else {
                storeKitProducts = []
                storeKitMessage = storeKitSandboxCatalogTestingEnabled
                    ? String(localized: "The App Store Sandbox catalog is incomplete or belongs to another subscription group. Purchases remain unavailable.")
                    : String(localized: "The local StoreKit catalog is incomplete. Purchases remain unavailable.")
                return
            }
            storeKitProducts = products
        } catch is CancellationError {
            return
        } catch {
            storeKitProducts = []
            storeKitMessage = storeKitSandboxCatalogTestingEnabled
                ? String(localized: "The App Store Sandbox catalog could not be loaded.")
                : String(localized: "The local StoreKit catalog could not be loaded.")
        }
    }

    private func refreshLocalStoreKitEntitlements() async {
        let snapshot = await storeKitClient.currentEntitlements(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        )
        let matchingTransactions = snapshot.transactions.filter(matchesLocalStoreKitEvidence)
        storeKitLocalEntitlements = matchingTransactions.map(Self.localRecord)
        storeKitContainsUnverifiedEntitlement = snapshot.containsUnverifiedTransaction
        storeKitContainsMismatchedEntitlement = matchingTransactions.count != snapshot.transactions.count
    }

    private func refreshLocalStoreKitSubscriptionStatuses() async {
        let snapshot = await storeKitClient.subscriptionStatuses(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        )
        applyLocalStoreKitSubscriptionStatuses(snapshot)
    }

    private func refreshLocalStoreKitState() async {
        async let entitlements: Void = refreshLocalStoreKitEntitlements()
        async let statuses: Void = refreshLocalStoreKitSubscriptionStatuses()
        _ = await (entitlements, statuses)
    }

    private func applyLocalStoreKitSubscriptionStatuses(
        _ snapshot: StoreKitSubscriptionStatusSnapshot
    ) {
        let matchingStatuses = snapshot.statuses.filter {
            matchesLocalStoreKitEvidence($0.transaction)
        }
        storeKitLocalSubscriptionStatuses = matchingStatuses.map(Self.localStatusRecord)
        storeKitContainsUnverifiedSubscriptionStatus = snapshot.containsUnverifiedStatus
        storeKitContainsMismatchedSubscriptionStatus = matchingStatuses.count != snapshot.statuses.count
        storeKitSubscriptionStatusLoadFailed = snapshot.loadFailed
    }

    private func acceptLocalStoreKitTransaction(_ evidence: StoreKitTransactionEvidence) async {
        guard matchesLocalStoreKitEvidence(evidence) else {
            storeKitMessage = String(localized: "The local transaction did not match the Rillora account, catalog, environment, or storefront. It was not finished.")
            return
        }

        let record = Self.localRecord(evidence)
        if !storeKitLocalTransactions.contains(where: { $0.transactionID == record.transactionID }) {
            storeKitLocalTransactions.append(record)
        }
        await storeKitClient.finish(transactionID: evidence.transactionID)
        await refreshLocalStoreKitState()
        storeKitMessage = String(localized: "StoreKit verified the local transaction. It changed no ordinary Rillora entitlement.")
    }

    private func acceptStoreKitSandboxTransaction(
        _ evidence: StoreKitTransactionEvidence
    ) async {
        guard matchesStoreKitSandboxEvidence(evidence),
              let storefrontCountryCode else {
            storeKitMessage = String(localized: "The Sandbox transaction did not match the Rillora account, catalog, environment, or storefront. It was not finished.")
            return
        }

        pendingStoreKitSandboxTransaction = evidence
        do {
            let response = try await service.submitStoreKitSandboxTransaction(
                request: StoreKitSandboxTransactionRequest(
                    signedTransaction: evidence.signedTransaction,
                    storefrontCountryCode: storefrontCountryCode
                )
            )
            storeKitSandboxServerStatus = response.result.status
            guard response.result.finishAuthorized else {
                storeKitMessage = String(localized: "Apple verified the Sandbox transaction, but the authoritative server snapshot is still pending. The transaction remains unfinished.")
                return
            }

            let record = Self.localRecord(evidence)
            if !storeKitSandboxTransactions.contains(where: {
                $0.transactionID == record.transactionID
            }) {
                storeKitSandboxTransactions.append(record)
            }
            await storeKitClient.finish(transactionID: evidence.transactionID)
            pendingStoreKitSandboxTransaction = nil
            storeKitMessage = String(localized: "Apple and the Rillora server verified the Sandbox subscription. The transaction was finished after durable acknowledgement; ordinary access remains Free.")
        } catch is CancellationError {
            return
        } catch {
            storeKitSandboxServerStatus = "verification_failed"
            storeKitMessage = String(localized: "The Rillora server could not verify the authoritative Sandbox status. The transaction remains unfinished and ordinary access is unchanged.")
        }
    }

    private func matchesLocalStoreKitEvidence(
        _ evidence: StoreKitTransactionEvidence
    ) -> Bool {
        guard let localAppAccountToken else { return false }
        return evidence.appAccountToken == localAppAccountToken
            && evidence.subscriptionGroupID
                == RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
            && RilloraStoreKitCatalog.familyProductIDs.contains(evidence.productID)
            && evidence.isXcodeEnvironment
            && (storefrontCountryCode == nil
                || evidence.storefrontCountryCode == storefrontCountryCode)
    }

    private func matchesStoreKitSandboxEvidence(
        _ evidence: StoreKitTransactionEvidence
    ) -> Bool {
        guard let localAppAccountToken else { return false }
        return evidence.appAccountToken == localAppAccountToken
            && evidence.subscriptionGroupID
                == RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
            && RilloraStoreKitCatalog.familyProductIDs.contains(evidence.productID)
            && !evidence.isXcodeEnvironment
            && evidence.environment.caseInsensitiveCompare("Sandbox") == .orderedSame
            && (storefrontCountryCode == nil
                || evidence.storefrontCountryCode == storefrontCountryCode)
    }

    private static func localRecord(
        _ evidence: StoreKitTransactionEvidence
    ) -> StoreKitLocalTransactionRecord {
        StoreKitLocalTransactionRecord(
            transactionID: evidence.transactionID,
            originalTransactionID: evidence.originalTransactionID,
            productID: evidence.productID,
            storefrontCountryCode: evidence.storefrontCountryCode,
            purchaseDate: evidence.purchaseDate,
            expirationDate: evidence.expirationDate,
            revocationDate: evidence.revocationDate,
            transactionReason: evidence.transactionReason
        )
    }

    private static func localStatusRecord(
        _ evidence: StoreKitSubscriptionStatusEvidence
    ) -> StoreKitLocalSubscriptionStatusRecord {
        StoreKitLocalSubscriptionStatusRecord(
            transactionID: evidence.transaction.transactionID,
            originalTransactionID: evidence.transaction.originalTransactionID,
            productID: evidence.transaction.productID,
            state: evidence.state,
            willAutoRenew: evidence.willAutoRenew,
            isInBillingRetry: evidence.isInBillingRetry,
            expirationDate: evidence.transaction.expirationDate,
            gracePeriodExpirationDate: evidence.gracePeriodExpirationDate
        )
    }

    private static func subscriptionStateLabel(_ state: StoreKitSubscriptionState) -> String {
        switch state {
        case .subscribed: String(localized: "subscribed")
        case .expired: String(localized: "expired")
        case .inBillingRetryPeriod: String(localized: "billing retry")
        case .inGracePeriod: String(localized: "grace period")
        case .revoked: String(localized: "revoked")
        case .unknown: String(localized: "unknown")
        }
    }

    private func refresh(storefrontCountryCode override: String?) async {
        refreshRevision += 1
        let revision = refreshRevision
        isLoading = true
        errorMessage = nil
        do {
            let status = try await service.fetchCommerceStatus(
                serviceMarketCode: serviceMarketCode
            )
            guard revision == refreshRevision, !Task.isCancelled else { return }
            self.status = status

            let countryCode: String?
            if let override {
                countryCode = override
            } else {
                countryCode = await storefrontProvider.currentCountryCode()
            }
            guard revision == refreshRevision, !Task.isCancelled else { return }
            guard let countryCode,
                  countryCode.range(
                    of: "^[A-Z]{3}$",
                    options: .regularExpression
                  ) != nil else {
                storefrontCountryCode = nil
                purchaseRoute = nil
                isLoading = false
                return
            }

            storefrontCountryCode = countryCode
            let route = try await service.resolvePurchaseRoute(
                request: .iOS(
                    serviceMarketCode: serviceMarketCode,
                    appleStorefrontCountryCode: countryCode
                )
            )
            guard revision == refreshRevision, !Task.isCancelled else { return }
            purchaseRoute = route
            isLoading = false
            await applePurchase?.refreshQuote()
        } catch is CancellationError {
            if revision == refreshRevision { isLoading = false }
        } catch {
            guard revision == refreshRevision else { return }
            purchaseRoute = nil
            isLoading = false
            errorMessage = String(localized: "Plan availability could not be checked. Purchases remain unavailable.")
        }
    }
}
