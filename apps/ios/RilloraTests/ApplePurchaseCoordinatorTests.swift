import XCTest
@testable import Rillora

@MainActor
final class ApplePurchaseCoordinatorTests: XCTestCase {
    func testNoPurchaseWithoutCurrentPriceAndExpressConsent() async {
        let f = await fixture()
        await f.coordinator.purchase(acceptedTerms: false)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        XCTAssertEqual(preparations, 0); XCTAssertEqual(purchases, 0)
        XCTAssertNotNil(f.coordinator.quote)
    }

    func testChangedPriceRequiresAnotherDeliberateConsent() async {
        let f = await fixture()
        await f.service.setAmount(119_990)
        await f.client.setAmount(119_990)
        await f.coordinator.purchase(acceptedTerms: true)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(f.coordinator.quote?.quote.priceMilliunits, 119_990)
        XCTAssertTrue(f.coordinator.message?.contains("price changed") == true)
    }

    func testStoreKitPriceMismatchCannotShowOrStartAnOffer() async {
        let f = await fixture()
        await f.client.setAmount(68_000)
        await f.coordinator.refreshQuote()
        XCTAssertNil(f.coordinator.quote)
        await f.coordinator.purchase(acceptedTerms: true)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
    }

    func testHistoryOutageIsNotPresentedAsHavingNoPurchases() async {
        let f = await fixture()
        await f.client.failHistory()
        await f.coordinator.restore()
        XCTAssertTrue(f.coordinator.message?.contains("could not be fully checked") == true)
        XCTAssertFalse(f.coordinator.message?.contains("No Rillora purchases") == true)
    }

    func testOnlyCommittedServerStateCanFinishThenRestoreRetries() async {
        let f = await fixture()
        await f.service.setFinished(false)
        await f.coordinator.purchase(acceptedTerms: true)
        let first = await f.client.finishes
        XCTAssertEqual(first, [])
        XCTAssertTrue(f.coordinator.message?.contains("being checked") == true)
        await f.service.setFinished(true)
        await f.coordinator.restore()
        let restored = await f.client.finishes
        XCTAssertEqual(restored, [100])
        let submissions = await f.service.submissions
        XCTAssertEqual(submissions, 2)
    }

    func testInconsistentFinishResponseIsRejectedEvenByInjectedService() async {
        let f = await fixture()
        await f.service.setInconsistent()
        await f.coordinator.purchase(acceptedTerms: true)
        let finished = await f.client.finishes
        XCTAssertTrue(finished.isEmpty)
    }

    func testRestoresHistoricalMonthlyFromSignedStorefrontAfterCountryChange() async {
        let f = await fixture()
        await f.client.setHistory(evidence(owner: f.owner, product: RilloraStoreKitCatalog.familyMonthlyProductID, country: "CAN"))
        await f.coordinator.restore()
        let finishes = await f.client.finishes
        let purchases = await f.client.purchases
        XCTAssertEqual(finishes, [100]); XCTAssertEqual(purchases, 0)
    }

    func testForeignOwnerAndSandboxNeverReachProductionReceiptIntake() async {
        let f = await fixture()
        await f.client.setHistory(evidence(owner: UUID()))
        await f.coordinator.restore()
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        await f.coordinator.restore()
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(submissions, 0); XCTAssertTrue(finishes.isEmpty)
        XCTAssertTrue(f.coordinator.message?.contains("different Apple environment") == true)
    }

    func testPendingAndCanceledOutcomesArePreservedWithoutFinishing() async {
        let f = await fixture()
        await f.client.setOutcome(.pending)
        await f.coordinator.purchase(acceptedTerms: true)
        let firstActions = await f.service.actions
        XCTAssertEqual(firstActions, ["start", "pending"])
        await f.coordinator.purchase(acceptedTerms: true)
        let stillPending = await f.service.actions
        XCTAssertEqual(stillPending, ["start", "pending"])
        let canceled = await fixture()
        await canceled.client.setOutcome(.userCancelled)
        await canceled.coordinator.purchase(acceptedTerms: true)
        let actions = await canceled.service.actions
        let finishes = await canceled.client.finishes
        XCTAssertEqual(actions, ["start", "cancel"])
        XCTAssertTrue(finishes.isEmpty)
    }

    func testAccountChangeDuringPreparationCannotOpenAnotherOwnersPaymentSheet() async {
        let f = await fixture()
        await f.service.pauseNextPreparation()
        let purchase = Task { await f.coordinator.purchase(acceptedTerms: true) }
        for _ in 0..<100 {
            if await f.service.waiting { break }
            await Task.yield()
        }
        let waiting = await f.service.waiting
        XCTAssertTrue(waiting)
        f.coordinator.reset()
        await f.coordinator.start(owner: UUID())
        await f.service.resumePreparation()
        await purchase.value
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
        XCTAssertNil(f.coordinator.message)
    }

    func testAccountChangeBeforeServerReceiptReturnsCannotFinishForTheNewSession() async {
        let f = await fixture()
        await f.service.pauseNextReceipt()
        let purchase = Task { await f.coordinator.purchase(acceptedTerms: true) }
        for _ in 0..<1000 {
            if await f.service.receiptWaiting { break }
            await Task.yield()
        }
        let waiting = await f.service.receiptWaiting
        XCTAssertTrue(waiting)
        f.coordinator.reset()
        await f.coordinator.start(owner: UUID())
        await f.service.resumeReceipt()
        await purchase.value
        let finishes = await f.client.finishes
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertNil(f.coordinator.message)
    }

    func testReviewPurchaseUsesSandboxContractAndNeverFinishesOnProductionAcknowledgement() async {
        let f = await fixture(environment: .sandbox)
        XCTAssertEqual(f.coordinator.environment, .sandbox)
        XCTAssertNotNil(f.coordinator.quote)
        await f.service.useWrongReceiptEnvironment()
        await f.coordinator.purchase(acceptedTerms: true)
        let premature = await f.client.finishes
        XCTAssertTrue(premature.isEmpty)
        await f.service.useCorrectReceiptEnvironment()
        await f.coordinator.restore()
        let restored = await f.client.finishes
        let environments = await f.service.submittedEnvironments
        XCTAssertEqual(restored, [100])
        XCTAssertEqual(environments, [.sandbox, .sandbox])
    }

    func testReviewBuildRejectsAProductionTransactionAndUnknownAppReceiptCannotPurchase() async {
        let review = await fixture(environment: .sandbox)
        await review.client.setHistory(evidence(owner: review.owner, environment: "Production"))
        await review.coordinator.restore()
        let submissions = await review.service.submissions
        XCTAssertEqual(submissions, 0)
        let unknown = await fixture(environment: nil)
        XCTAssertNil(unknown.coordinator.quote)
        await unknown.coordinator.purchase(acceptedTerms: true)
        await unknown.coordinator.restore()
        let purchases = await unknown.client.purchases
        XCTAssertEqual(purchases, 0)
        XCTAssertTrue(unknown.coordinator.message?.contains("temporarily unavailable") == true)
    }

    func testMissingAppReceiptIsRefreshedOnlyAfterExplicitRestore() async {
        let f = await fixture(environment: nil, refreshedEnvironment: .sandbox)
        await f.coordinator.restore(synchronize: false)
        let automaticRefreshes = await f.client.appRefreshes
        XCTAssertEqual(automaticRefreshes, 0)
        XCTAssertNil(f.coordinator.environment)
        XCTAssertNil(f.coordinator.quote)

        await f.coordinator.restore()
        let refreshes = await f.client.appRefreshes
        let syncs = await f.client.syncs
        let purchases = await f.client.purchases
        XCTAssertEqual(refreshes, 1)
        XCTAssertEqual(syncs, 1)
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(f.coordinator.environment, .sandbox)
        XCTAssertNotNil(f.coordinator.quote)
        XCTAssertFalse(f.coordinator.busy)
    }

    func testCanceledAppAuthenticationStaysQuietAndCanBeRetried() async {
        let f = await fixture(environment: nil, refreshedEnvironment: .sandbox)
        await f.client.cancelNextAppRefresh()
        await f.coordinator.restore()
        let firstSyncs = await f.client.syncs
        XCTAssertEqual(firstSyncs, 0)
        XCTAssertNil(f.coordinator.environment)
        XCTAssertNil(f.coordinator.message)
        XCTAssertFalse(f.coordinator.busy)
        await f.coordinator.restore()
        XCTAssertEqual(f.coordinator.environment, .sandbox)
        XCTAssertNotNil(f.coordinator.quote)
    }

    func testUnverifiedRefreshedAppCannotReachPurchaseOrReceiptIntake() async {
        let f = await fixture(environment: nil)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        await f.coordinator.restore()
        await f.coordinator.purchase(acceptedTerms: true)
        let refreshes = await f.client.appRefreshes
        let syncs = await f.client.syncs
        let submissions = await f.service.submissions
        let preparations = await f.service.preparations
        XCTAssertEqual(refreshes, 1)
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(submissions, 0)
        XCTAssertEqual(preparations, 0)
        XCTAssertNil(f.coordinator.environment)
        XCTAssertNil(f.coordinator.quote)
    }

    func testAccountChangeDuringAppRefreshDiscardsResultAndPreventsDuplicatePrompts() async {
        let f = await fixture(environment: nil, refreshedEnvironment: .sandbox)
        await f.client.pauseNextAppRefresh()
        let restore = Task { await f.coordinator.restore() }
        for _ in 0..<1000 {
            if await f.client.appRefreshWaiting { break }
            await Task.yield()
        }
        let waiting = await f.client.appRefreshWaiting
        XCTAssertTrue(waiting)
        XCTAssertTrue(f.coordinator.busy)
        await f.coordinator.restore()
        let refreshes = await f.client.appRefreshes
        XCTAssertEqual(refreshes, 1)
        f.coordinator.reset()
        await f.coordinator.start(owner: UUID())
        await f.client.resumeAppRefresh()
        await restore.value
        let syncs = await f.client.syncs
        let submissions = await f.service.submissions
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(submissions, 0)
        XCTAssertNil(f.coordinator.environment)
        XCTAssertNil(f.coordinator.quote)
        XCTAssertNil(f.coordinator.message)
        XCTAssertFalse(f.coordinator.busy)
    }

    private func fixture(environment: ApplePurchaseEnvironment? = .production, refreshedEnvironment: ApplePurchaseEnvironment? = nil) async -> (coordinator: ApplePurchaseCoordinator, service: ApplePurchaseServiceSpy, client: ApplePurchaseClientSpy, owner: UUID) {
        let owner = UUID()
        let service = ApplePurchaseServiceSpy(owner: owner, environment: environment ?? refreshedEnvironment ?? .production)
        let client = ApplePurchaseClientSpy(owner: owner, environment: environment)
        await client.setRefreshedEnvironment(refreshedEnvironment)
        let coordinator = ApplePurchaseCoordinator(service: service, client: client,
            storefront: ApplePurchaseStorefrontFixture(), serviceMarket: "GLOBAL_US")
        await coordinator.start(owner: owner)
        return (coordinator, service, client, owner)
    }
}

private actor ApplePurchaseServiceSpy: ApplePurchaseServing {
    let owner: UUID
    var amount = 99_990
    let environment: ApplePurchaseEnvironment
    var submittedEnvironments: [ApplePurchaseEnvironment] = []
    var wrongReceiptEnvironment = false
    func useWrongReceiptEnvironment() { wrongReceiptEnvironment = true }
    func useCorrectReceiptEnvironment() { wrongReceiptEnvironment = false }
    var preparations = 0, submissions = 0
    var actions: [String] = []
    var finished = true, inconsistent = false, pause = false
    var continuation: CheckedContinuation<ApplePurchaseIntent, Never>?
    var receiptContinuation: CheckedContinuation<AppleTransactionResponse, Never>?
    var pauseReceipt = false
    var currentPurchase: ApplePendingPurchase?
    var waiting: Bool { continuation != nil }
    var receiptWaiting: Bool { receiptContinuation != nil }
    init(owner: UUID, environment: ApplePurchaseEnvironment) { self.owner = owner; self.environment = environment }
    func setAmount(_ value: Int) { amount = value }
    func setFinished(_ value: Bool) { finished = value }
    func setInconsistent() { inconsistent = true }
    func pauseNextPreparation() { pause = true }
    func pauseNextReceipt() { pauseReceipt = true }
    func resumeReceipt() { receiptContinuation?.resume(returning: receipt()); receiptContinuation = nil }
    func resumePreparation() {
        continuation?.resume(returning: intent()); continuation = nil
    }
    func fetchAppleQuote(serviceMarket: String, storefront: String, environment: ApplePurchaseEnvironment) async throws -> AppleQuoteResponse {
        AppleQuoteResponse(contractVersion: "commerce-apple-purchase-v1", quote: ApplePurchaseQuote(bindingCode: "fixture",
            priceCode: "family_fixture", productId: RilloraStoreKitCatalog.familyAnnualProductID,
            serviceMarketCode: serviceMarket, storefrontCountryCode: storefront, currency: "USD",
            amountMinor: amount / 10, minorUnitExponent: 2, priceMilliunits: amount, billingPeriod: "annual"),
            purchaseTerms: ApplePurchaseTerms(version: "family-annual-apple-20260926-1",
                termsVersion: LegalAcceptanceProof.current.termsVersion, subscriptionTermsVersion: "subscriptions-2026-08-27-1",
                refundPolicyVersion: "refunds-2026-08-27-1", legalBundleSha256: LegalAcceptanceProof.current.bundleSha256),
            requiresFreshEvaluation: true, environment: environment, validationOnly: environment == .sandbox)
    }
    func prepareApplePurchase(_ preparation: ApplePurchasePreparation, nonce: UUID, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseIntent {
        guard preparation.expectedAppAccountToken == owner else { throw RilloraAPIError.invalidResponse }
        preparations += 1
        currentPurchase = ApplePendingPurchase(orderReference: UUID(), nonce: nonce, state: "prepared")
        if pause { return await withCheckedContinuation { continuation = $0 } }
        return intent()
    }
    private func intent() -> ApplePurchaseIntent {
        ApplePurchaseIntent(contractVersion: "commerce-apple-purchase-v1", orderReference: currentPurchase?.orderReference ?? UUID(), appAccountToken: owner, state: "prepared", grantsAccess: false, environment: environment, validationOnly: environment == .sandbox)
    }
    func changeApplePurchase(_ reference: UUID, action: String, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseState {
        actions.append(action)
        let state = action == "start" ? "started" : action == "pending" ? "pending" : "closed"
        if let existing = currentPurchase {
            currentPurchase = action == "cancel" ? nil : ApplePendingPurchase(orderReference: reference, nonce: existing.nonce, state: state)
        }
        return ApplePurchaseState(state: state)
    }
    func pendingApplePurchase(environment: ApplePurchaseEnvironment) async throws -> ApplePendingPurchaseResponse { ApplePendingPurchaseResponse(purchase: currentPurchase) }
    func submitAppleTransaction(_ evidence: StoreKitTransactionEvidence, environment: ApplePurchaseEnvironment) async throws -> AppleTransactionResponse {
        submissions += 1; submittedEnvironments.append(environment)
        if pauseReceipt { return await withCheckedContinuation { receiptContinuation = $0 } }
        return receipt()
    }
    private func receipt() -> AppleTransactionResponse {
        if finished && !inconsistent { currentPurchase = nil }
        let mode = wrongReceiptEnvironment ? .production : environment
        return AppleTransactionResponse(contractVersion: mode.receiptContract, result: .init(accepted: true,
            status: inconsistent ? "pending" : finished ? "applied" : "pending", finishAuthorized: finished,
            authoritativeSnapshotLoaded: finished, entitlementChanged: finished), environment: mode, validationOnly: mode == .sandbox)
    }
}

private actor ApplePurchaseClientSpy: StoreKitPurchasing {
    var appEnvironment: ApplePurchaseEnvironment?
    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? { appEnvironment }
    var refreshedEnvironment: ApplePurchaseEnvironment?
    var appRefreshes = 0, syncs = 0
    var cancelAppRefresh = false, pauseAppRefresh = false
    var appRefreshContinuation: CheckedContinuation<Void, Never>?
    var appRefreshWaiting: Bool { appRefreshContinuation != nil }
    func setRefreshedEnvironment(_ value: ApplePurchaseEnvironment?) { refreshedEnvironment = value }
    func cancelNextAppRefresh() { cancelAppRefresh = true }
    func pauseNextAppRefresh() { pauseAppRefresh = true }
    func resumeAppRefresh() { appRefreshContinuation?.resume(); appRefreshContinuation = nil }
    func refreshAppEnvironment() async throws -> ApplePurchaseEnvironment? {
        appRefreshes += 1
        if pauseAppRefresh { await withCheckedContinuation { appRefreshContinuation = $0 } }
        if cancelAppRefresh { cancelAppRefresh = false; throw CancellationError() }
        appEnvironment = refreshedEnvironment
        return appEnvironment
    }
    let owner: UUID
    var amount = 99_990
    var purchases = 0
    var finishes: [UInt64] = []
    var history: StoreKitTransactionEvidence?
    var nextOutcome: StoreKitPurchaseOutcome?
    var historyFailed = false
    init(owner: UUID, environment: ApplePurchaseEnvironment?) { self.owner = owner; self.appEnvironment = environment }
    func setAmount(_ value: Int) { amount = value }
    func setHistory(_ value: StoreKitTransactionEvidence) { history = value }
    func setOutcome(_ value: StoreKitPurchaseOutcome) { nextOutcome = value }
    func failHistory() { historyFailed = true }
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        [.init(productID: RilloraStoreKitCatalog.familyAnnualProductID, displayName: "Fixture Family", description: "Synthetic",
            displayPrice: "$\(amount / 1000).99", subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            priceMilliunits: amount, currencyCode: "USD", oneYearSubscription: true)]
    }
    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        StoreKitEntitlementSnapshot(transactions: history.map { [$0] } ?? [], containsUnverifiedTransaction: false)
    }
    func subscriptionStatuses(identifiers: Set<String>) async -> StoreKitSubscriptionStatusSnapshot {
        .init(statuses: [], containsUnverifiedStatus: false, loadFailed: historyFailed)
    }
    func purchase(productID: String, appAccountToken: UUID, expectedStorefrontCountryCode: String?) async throws -> StoreKitPurchaseOutcome {
        purchases += 1
        if let nextOutcome { return nextOutcome }
        let value = evidence(owner: owner, environment: appEnvironment?.rawValue ?? "Unknown"); history = value; return .verified(value)
    }
    nonisolated func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate> { AsyncStream { $0.finish() } }
    nonisolated func subscriptionStatusUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> { AsyncStream { $0.finish() } }
    func finish(transactionID: UInt64) async { finishes.append(transactionID) }
    func sync() async throws { syncs += 1 }
}
private struct ApplePurchaseStorefrontFixture: CommerceStorefrontProviding {
    func currentCountryCode() async -> String? { "USA" }
    func countryCodeUpdates() -> AsyncStream<String> { AsyncStream { $0.finish() } }
}
private func evidence(owner: UUID, product: String = RilloraStoreKitCatalog.familyAnnualProductID,
                      country: String = "USA", environment: String = "Production") -> StoreKitTransactionEvidence {
    StoreKitTransactionEvidence(transactionID: 100, originalTransactionID: 100, productID: product,
        subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID, appAccountToken: owner,
        environment: environment, storefrontCountryCode: country, purchaseDate: .now,
        expirationDate: .now.addingTimeInterval(86400), revocationDate: nil, transactionReason: "PURCHASE",
        signedTransaction: "synthetic.transaction.fixture", isXcodeEnvironment: false)
}
