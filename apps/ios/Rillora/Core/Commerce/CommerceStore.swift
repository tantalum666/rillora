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

    private let service: any CommerceServing
    private let storefrontProvider: any CommerceStorefrontProviding
    private let storeKitClient: any StoreKitPurchasing
    private let serviceMarketCode: String
    private let storeKitTestAppAccountToken: UUID?
    private var localAppAccountToken: UUID?
    private var pendingStoreKitSandboxTransaction: StoreKitTransactionEvidence?

    init(
        service: any CommerceServing,
        storefrontProvider: any CommerceStorefrontProviding,
        storeKitClient: any StoreKitPurchasing = UnavailableStoreKitClient(),
        storeKitTestEnvironment: RilloraStoreKitTestEnvironment = .disabled,
        storeKitTestAppAccountToken: UUID? = nil,
        serviceMarketCode: String
    ) {
        self.service = service
        self.storefrontProvider = storefrontProvider
        self.storeKitClient = storeKitClient
        self.storeKitTestEnvironment = storeKitTestEnvironment
        self.storeKitTestAppAccountToken = storeKitTestAppAccountToken
        self.serviceMarketCode = serviceMarketCode
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
        guard let planCode = status?.currentAccess.planCode else { return "View" }
        let label = planCode == "free" ? "Free" : planCode.capitalized
        return label + (status?.validationOnly == true ? " · Test access" : "")
    }

    var purchaseIsAvailable: Bool {
        status?.billingOpen == true
            && purchaseRoute?.purchaseRoute != "none"
            && purchaseRoute?.reason == "available"
    }

    func start(appAccountToken: UUID? = nil) async {
        localAppAccountToken = appAccountToken
        await refresh()
        if storeKitTestEnvironment.isEnabled {
            await loadStoreKitProducts()
        }
        if storeKitLocalTestingEnabled {
            await refreshLocalStoreKitState()
        }

        async let storefrontUpdates: Void = observeStorefrontUpdates()
        async let transactionUpdates: Void = observeStoreKitTransactionUpdates()
        async let subscriptionStatusUpdates: Void = observeStoreKitSubscriptionStatusUpdates()
        _ = await (storefrontUpdates, transactionUpdates, subscriptionStatusUpdates)
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
                storeKitMessage = "StoreKit returned an unverified transaction. It was not recorded or finished."
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
                storeKitMessage = "Local subscription state: \(Self.subscriptionStateLabel(state)). Ordinary Rillora access is unchanged."
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
            storeKitMessage = "The selected local StoreKit product is not available."
            return
        }
        guard let localAppAccountToken else {
            storeKitMessage = "A signed-in Rillora account is required to bind the local transaction."
            return
        }

        isStoreKitWorking = true
        storeKitMessage = nil
        defer { isStoreKitWorking = false }
        do {
            let outcome = try await storeKitClient.purchase(
                productID: productID,
                appAccountToken: localAppAccountToken,
                expectedStorefrontCountryCode: storefrontCountryCode
            )
            switch outcome {
            case .verified(let evidence):
                await acceptLocalStoreKitTransaction(evidence)
            case .pending:
                storeKitMessage = "The local StoreKit purchase is pending. No Rillora access changed."
            case .userCancelled:
                storeKitMessage = "The local StoreKit purchase was cancelled."
            case .unverified:
                storeKitMessage = "StoreKit returned an unverified purchase. It was not recorded or finished."
            }
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = "The local StoreKit purchase could not be completed. No Rillora access changed."
        }
    }

    func purchaseStoreKitSandboxProduct(productID: String) async {
        guard storeKitSandboxPurchaseTestingEnabled else { return }
        guard RilloraStoreKitCatalog.purchasableFamilyProductIDs.contains(productID),
              storeKitProducts.contains(where: { $0.productID == productID }) else {
            storeKitMessage = "The selected App Store Sandbox product is not available."
            return
        }
        guard let localAppAccountToken else {
            storeKitMessage = "The Sandbox purchase is missing its synthetic Rillora account binding."
            return
        }

        isStoreKitWorking = true
        storeKitMessage = nil
        defer { isStoreKitWorking = false }
        do {
            let outcome = try await storeKitClient.purchase(
                productID: productID,
                appAccountToken: localAppAccountToken,
                expectedStorefrontCountryCode: storefrontCountryCode
            )
            switch outcome {
            case .verified(let evidence):
                await acceptStoreKitSandboxTransaction(evidence)
            case .pending:
                storeKitMessage = "The Sandbox purchase is pending. No Rillora access changed."
            case .userCancelled:
                storeKitMessage = "The Sandbox purchase was cancelled."
            case .unverified:
                storeKitMessage = "Apple returned an unverified Sandbox purchase. It was not submitted or finished."
            }
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = "The Sandbox purchase could not be completed. No Rillora access changed."
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
            storeKitMessage = "Local StoreKit history was refreshed. Ordinary Rillora access is still server-owned."
        } catch is CancellationError {
            return
        } catch {
            storeKitMessage = "Local StoreKit history could not be refreshed. No Rillora access changed."
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
                    ? "The App Store Sandbox catalog is incomplete or belongs to another subscription group. Purchases remain unavailable."
                    : "The local StoreKit catalog is incomplete. Purchases remain unavailable."
                return
            }
            storeKitProducts = products
        } catch is CancellationError {
            return
        } catch {
            storeKitProducts = []
            storeKitMessage = storeKitSandboxCatalogTestingEnabled
                ? "The App Store Sandbox catalog could not be loaded."
                : "The local StoreKit catalog could not be loaded."
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
            storeKitMessage = "The local transaction did not match the Rillora account, catalog, environment, or storefront. It was not finished."
            return
        }

        let record = Self.localRecord(evidence)
        if !storeKitLocalTransactions.contains(where: { $0.transactionID == record.transactionID }) {
            storeKitLocalTransactions.append(record)
        }
        await storeKitClient.finish(transactionID: evidence.transactionID)
        await refreshLocalStoreKitState()
        storeKitMessage = "StoreKit verified the local transaction. It changed no ordinary Rillora entitlement."
    }

    private func acceptStoreKitSandboxTransaction(
        _ evidence: StoreKitTransactionEvidence
    ) async {
        guard matchesStoreKitSandboxEvidence(evidence),
              let storefrontCountryCode else {
            storeKitMessage = "The Sandbox transaction did not match the Rillora account, catalog, environment, or storefront. It was not finished."
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
                storeKitMessage = "Apple verified the Sandbox transaction, but the authoritative server snapshot is still pending. The transaction remains unfinished."
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
            storeKitMessage = "Apple and the Rillora server verified the Sandbox subscription. The transaction was finished after durable acknowledgement; ordinary access remains Free."
        } catch is CancellationError {
            return
        } catch {
            storeKitSandboxServerStatus = "verification_failed"
            storeKitMessage = "The Rillora server could not verify the authoritative Sandbox status. The transaction remains unfinished and ordinary access is unchanged."
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
        case .subscribed: "subscribed"
        case .expired: "expired"
        case .inBillingRetryPeriod: "billing retry"
        case .inGracePeriod: "grace period"
        case .revoked: "revoked"
        case .unknown: "unknown"
        }
    }

    private func refresh(storefrontCountryCode override: String?) async {
        isLoading = true
        errorMessage = nil
        do {
            let status = try await service.fetchCommerceStatus(
                serviceMarketCode: serviceMarketCode
            )
            self.status = status

            let countryCode: String?
            if let override {
                countryCode = override
            } else {
                countryCode = await storefrontProvider.currentCountryCode()
            }
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
            purchaseRoute = try await service.resolvePurchaseRoute(
                request: .iOS(
                    serviceMarketCode: serviceMarketCode,
                    appleStorefrontCountryCode: countryCode
                )
            )
            isLoading = false
        } catch is CancellationError {
            isLoading = false
        } catch {
            purchaseRoute = nil
            isLoading = false
            errorMessage = "Plan availability could not be checked. Purchases remain unavailable."
        }
    }
}
