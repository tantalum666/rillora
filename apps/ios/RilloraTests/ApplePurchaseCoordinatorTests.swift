import XCTest
@testable import Rillora

@MainActor
final class ApplePurchaseCoordinatorTests: XCTestCase {
    func testBackgroundReceiptRefreshesPendingStateWithoutReloadingTheQuote() async throws {
        let owner = UUID()
        let service = ApplePurchaseServiceSpy(owner: owner, environment: .sandbox)
        await service.seedPending(token: owner)
        let client = ApplePurchaseClientSpy(owner: owner, environment: .sandbox, observesUpdates: true)
        let store = CommerceStore(service: service, storefrontProvider: ApplePurchaseStorefrontFixture(),
            storeKitClient: client, serviceMarketCode: "GLOBAL_US", storeKitProductionEnabled: true)
        let start = Task { await store.start(appAccountToken: owner) }
        defer { start.cancel() }
        let purchase = try XCTUnwrap(store.applePurchase)
        for _ in 0..<2000 {
            if purchase.quote != nil, purchase.pending != nil, !purchase.busy { break }
            await Task.yield()
        }
        XCTAssertNotNil(purchase.quote)
        XCTAssertNotNil(purchase.pending)
        let quote = purchase.quote
        await client.emit(.verified(evidence(owner: owner, environment: "Sandbox", id: 401)))
        for _ in 0..<2000 {
            if await service.statusReads >= 2, purchase.pending == nil { break }
            await Task.yield()
        }
        XCTAssertNil(purchase.pending, "A reconciled background transaction must clear the stale pending UI")
        XCTAssertEqual(purchase.quote, quote)
        let quoteReads = await service.quoteReads
        let finishes = await client.finishes
        XCTAssertEqual(quoteReads, 1)
        XCTAssertEqual(finishes, [401])
        await client.endUpdates()
        await start.value
    }

    func testTransactionReconciliationRefreshesAccessWithoutReloadingTheDisplayedQuote() async throws {
        let owner = UUID()
        let service = ApplePurchaseServiceSpy(owner: owner, environment: .sandbox)
        let client = ApplePurchaseClientSpy(owner: owner, environment: .sandbox)
        let store = CommerceStore(service: service, storefrontProvider: ApplePurchaseStorefrontFixture(),
            storeKitClient: client, serviceMarketCode: "GLOBAL_US", storeKitProductionEnabled: true)
        await store.start(appAccountToken: owner)
        let purchase = try XCTUnwrap(store.applePurchase)
        let quote = try XCTUnwrap(purchase.quote)
        let initialQuoteReads = await service.quoteReads
        let initialStatusReads = await service.statusReads

        // Several historical renewal transactions can arrive together after restoring.
        // Reconciliation must update access, without clearing/re-fetching the price each time.
        for id in UInt64(201)...203 {
            await client.setHistory(evidence(owner: owner, environment: "Sandbox", id: id))
            await purchase.restore(synchronize: false)
            XCTAssertEqual(purchase.quote, quote)
        }
        let quoteReads = await service.quoteReads
        let statusReads = await service.statusReads
        let finishes = await client.finishes
        XCTAssertEqual(quoteReads, initialQuoteReads)
        XCTAssertEqual(statusReads, initialStatusReads + 3)
        XCTAssertEqual(finishes, [201, 202, 203])

        // Deliberate refresh still re-evaluates the quote.
        await store.refresh()
        let refreshedReads = await service.quoteReads
        XCTAssertEqual(refreshedReads, initialQuoteReads + 1)

        // Retaining the displayed quote must not waive the fresh check before payment.
        await client.setHistory(nil)
        await client.setAmount(119_990)
        await service.setAmount(119_990)
        await purchase.purchase(accepting: quote)
        let preparations = await service.preparations
        let purchases = await client.purchases
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertNotEqual(purchase.quote, quote)
    }

    func testKnownForeignCurrentPurchaseDoesNotPromptOrReadHistoricalStatusAgain() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: UUID(), environment: "Sandbox"))
        let historicalReads = await f.client.historyReads
        await f.coordinator.restore()
        let syncs = await f.client.syncs
        let readsAfter = await f.client.historyReads
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(readsAfter, historicalReads)
        XCTAssertEqual(submissions, 0)
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
    }

    func testKnownForeignCurrentPurchaseCannotCreateAnotherOrderOrOpenPaymentSheet() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: UUID(), environment: "Sandbox"))
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        let submissions = await f.service.submissions
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(submissions, 0)
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
    }

    func testForeignReceiptReturnedByPurchaseIsExplainedWithoutFinishingOrCancelingIt() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setOutcome(.verified(evidence(owner: UUID(), environment: "Sandbox")))
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        let actions = await f.service.actions
        XCTAssertEqual(submissions, 0)
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertEqual(actions, ["start"])
        XCTAssertEqual(f.coordinator.pending?.state, "started")
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
    }

    func testPendingCheckNeverForcesAuthenticationOrLoadsHistoricalStatus() async {
        let f = await fixture(environment: .sandbox)
        await f.service.seedPending(token: UUID())
        let readsBefore = await f.client.historyReads
        await f.coordinator.checkPendingPurchase()
        let syncs = await f.client.syncs
        let appRefreshes = await f.client.appRefreshes
        let readsAfter = await f.client.historyReads
        let preparations = await f.service.preparations
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(appRefreshes, 0)
        XCTAssertEqual(readsAfter, readsBefore)
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(f.coordinator.pending?.state, "started")
        XCTAssertTrue(f.coordinator.message?.contains("not returned a matching purchase") == true)
    }

    func testPendingCheckRecoversServerOwnedUnfinishedTransactionBeforeConsideringForeignCurrentHistory() async {
        let f = await fixture(environment: .sandbox), token = UUID()
        await f.service.seedPending(token: token)
        await f.client.setHistory(evidence(owner: UUID(), environment: "Sandbox"))
        await f.client.setUnfinished([evidence(owner: token, environment: "Sandbox", id: 101)])
        let readsBefore = await f.client.historyReads
        await f.coordinator.checkPendingPurchase()
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        let readsAfter = await f.client.historyReads
        let syncs = await f.client.syncs
        XCTAssertEqual(submissions, 1)
        XCTAssertEqual(finishes, [101])
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(readsAfter, readsBefore)
        XCTAssertNil(f.coordinator.pending)
        XCTAssertFalse(f.coordinator.purchaseBlockedByAccount)
    }

    func testUnfinishedForeignPurchaseIsNotSubmittedFinishedOrRepurchased() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setUnfinished([evidence(owner: UUID(), environment: "Sandbox")])
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(submissions, 0)
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertTrue(f.coordinator.purchaseBlockedByAccount)
    }

    func testExpiredForeignHistoryDoesNotForceSyncOrAllowAnotherAccountToRepurchase() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistorical(evidence(owner: UUID(), environment: "Sandbox"))
        await f.coordinator.restore()
        let syncs = await f.client.syncs
        XCTAssertEqual(syncs, 0)
        XCTAssertTrue(f.coordinator.purchaseBlockedByAccount)
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
    }

    func testPurchaseChecksForeignExpiredHistoryBeforeCreatingOrChargingANewOrder() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistorical(evidence(owner: UUID(), environment: "Sandbox"))
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        let syncs = await f.client.syncs
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(syncs, 0)
        XCTAssertTrue(f.coordinator.purchaseBlockedByAccount)
    }

    func testUnavailableHistoryCannotOpenANewPaymentSheet() async {
        let f = await fixture(environment: .sandbox)
        await f.client.failHistory()
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertTrue(f.coordinator.message?.contains("could not be fully checked") == true)
    }

    func testMissingAccountTokenIsUnknownOwnershipNotAnotherNamedAccount() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: nil, environment: "Sandbox"))
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        XCTAssertEqual(preparations, 0)
        XCTAssertTrue(f.coordinator.message?.contains("could not confirm which Rillora account") == true)
        XCTAssertFalse(f.coordinator.message?.contains("originally used") == true)
    }

    func testPendingCheckDoesNotRefreshAnUnknownAppReceipt() async {
        let f = await fixture(environment: nil, refreshedEnvironment: .sandbox)
        await f.coordinator.checkPendingPurchase()
        let refreshes = await f.client.appRefreshes
        let syncs = await f.client.syncs
        XCTAssertEqual(refreshes, 0)
        XCTAssertEqual(syncs, 0)
        XCTAssertNil(f.coordinator.environment)
    }

    func testUnverifiedPendingHistoryDoesNotClaimNoPurchaseOrForceSync() async {
        let f = await fixture(environment: .sandbox)
        await f.service.seedPending(token: UUID())
        await f.client.setUnfinished([], unverified: true)
        await f.coordinator.checkPendingPurchase()
        let syncs = await f.client.syncs
        let submissions = await f.service.submissions
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(submissions, 0)
        XCTAssertEqual(f.coordinator.pending?.state, "started")
        XCTAssertTrue(f.coordinator.message?.contains("could not be fully checked") == true)
    }

    func testOwnedExistingPurchaseReconcilesWithoutOpeningAnotherPaymentSheet() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        let finishes = await f.client.finishes
        XCTAssertEqual(preparations, 0)
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(finishes, [100])
    }

    func testRestoreProcessesOwnedCurrentPurchaseAlongsideUnrelatedAccountHistory() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: UUID(), environment: "Sandbox"))
        await f.client.setAdditionalCurrent([evidence(owner: f.owner, environment: "Sandbox", id: 101)])
        await f.coordinator.restore()
        let finishes = await f.client.finishes
        let syncs = await f.client.syncs
        XCTAssertEqual(finishes, [101])
        XCTAssertEqual(syncs, 0)
        XCTAssertFalse(f.coordinator.purchaseBlockedByAccount)
    }

    func testCleanSandboxHistoryClearsConflictAndReusesTheExistingOrderNonce() async {
        let f = await fixture(environment: .sandbox)
        await f.service.seedPending(token: UUID())
        let original = await f.service.currentPurchase
        await f.client.setHistory(evidence(owner: UUID(), environment: "Sandbox"))
        await f.coordinator.checkPendingPurchase()
        XCTAssertTrue(f.coordinator.purchaseBlockedByAccount)
        await f.client.setHistory(nil)
        await f.coordinator.checkPendingPurchase()
        XCTAssertFalse(f.coordinator.purchaseBlockedByAccount)
        XCTAssertEqual(f.coordinator.pending, original)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let nonces = await f.service.preparedNonces
        let finishes = await f.client.finishes
        XCTAssertEqual(nonces, [original!.nonce])
        XCTAssertEqual(finishes, [100])
    }

    func testOldOwnedPurchaseReadbackCannotReplaceNewAccountPendingState() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        f.coordinator.onReconciled = { await f.service.pauseNextPending() }
        let purchase = Task { await f.coordinator.purchase(accepting: f.coordinator.quote) }
        for _ in 0..<1000 {
            if await f.service.pendingWaiting { break }
            await Task.yield()
        }
        let waiting = await f.service.pendingWaiting
        XCTAssertTrue(waiting)
        f.coordinator.onReconciled = nil
        f.coordinator.reset()
        await f.service.seedPending(token: UUID())
        await f.coordinator.start(owner: UUID())
        let current = f.coordinator.pending
        XCTAssertNotNil(current)
        await f.service.resumePending()
        await purchase.value
        XCTAssertEqual(f.coordinator.pending, current)
    }

    func testServerOwnershipConflictRemainsVisibleWithoutFinishingOrCancelingOrder() async {
        let f = await fixture(environment: .sandbox)
        await f.service.rejectReceiptOwner()
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let finishes = await f.client.finishes
        let actions = await f.service.actions
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertEqual(actions, ["start"])
        XCTAssertEqual(f.coordinator.pending?.state, "started")
        XCTAssertTrue(f.coordinator.purchaseBlockedByAccount)
        XCTAssertTrue(f.coordinator.message?.contains("originally used") == true)
    }

    func testPurchaseUsesServerIntentTokenAndRestoreRecoversThatOwnedTokenWithoutANewOrder() async {
        let f = await fixture(environment: .sandbox), token = UUID()
        XCTAssertNotEqual(token, f.owner)
        await f.service.usePurchaseToken(token)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let supplied = await f.client.suppliedAccountToken
        XCTAssertEqual(supplied, token)
        let initial = await f.service.submissions
        XCTAssertEqual(initial, 1)
        await f.coordinator.restore()
        let restored = await f.service.submissions
        let prepared = await f.service.preparations
        XCTAssertEqual(restored, 2)
        XCTAssertEqual(prepared, 1)
    }
    func testOwnedVerifiedHistoryRestoresWithoutForcingSystemAuthentication() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        await f.coordinator.restore()
        let syncs = await f.client.syncs
        let refreshes = await f.client.appRefreshes
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(syncs, 0)
        XCTAssertEqual(refreshes, 0)
        XCTAssertEqual(submissions, 1)
        XCTAssertEqual(finishes, [100])
        XCTAssertEqual(f.coordinator.message, String(localized: "Your Apple purchase status is up to date."))
    }

    func testMissingHistoryUsesExplicitSyncThenServerVerification() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistoryAfterSync(evidence(owner: f.owner, environment: "Sandbox"))
        await f.coordinator.restore()
        let syncs = await f.client.syncs
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(syncs, 1)
        XCTAssertEqual(submissions, 1)
        XCTAssertEqual(finishes, [100])
    }

    func testCatalogPriceRemainsVisibleWhenServerDisallowsNewPurchase() async {
        let f = await fixture()
        await f.service.rejectNewQuotes()
        await f.coordinator.refreshQuote()
        XCTAssertNotNil(f.coordinator.catalogProduct)
        XCTAssertNil(f.coordinator.quote)
        XCTAssertNil(f.coordinator.product)
        XCTAssertFalse(f.coordinator.isLoadingQuote)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let preparations = await f.service.preparations
        XCTAssertEqual(preparations, 0)
    }

    func testOlderCatalogResponseCannotReplaceNewerDisplayedQuote() async {
        let f = await fixture()
        await f.client.pauseNextCatalog()
        let older = Task { await f.coordinator.refreshQuote() }
        for _ in 0..<1000 {
            if await f.client.catalogWaiting { break }
            await Task.yield()
        }
        let waiting = await f.client.catalogWaiting
        XCTAssertTrue(waiting)
        await f.client.setAmount(119_990)
        await f.service.setAmount(119_990)
        await f.coordinator.refreshQuote()
        await f.client.resumeCatalog()
        await older.value
        XCTAssertEqual(f.coordinator.catalogProduct?.priceMilliunits, 119_990)
        XCTAssertEqual(f.coordinator.quote?.quote.priceMilliunits, 119_990)
        XCTAssertFalse(f.coordinator.isLoadingQuote)
    }

    func testPartialHistoryIsNotReportedAsCompletelyRestored() async {
        let f = await fixture(environment: .sandbox)
        await f.client.setHistory(evidence(owner: f.owner, environment: "Sandbox"))
        await f.client.failHistory()
        await f.coordinator.restore()
        let submissions = await f.service.submissions
        XCTAssertEqual(submissions, 1)
        XCTAssertEqual(f.coordinator.message, String(localized: "Apple purchase history could not be fully checked. Try again shortly."))
    }

    func testOpeningPageAndMissingDisplayedQuoteCannotPurchase() async {
        let f = await fixture()
        await f.coordinator.purchase(accepting: nil)
        let preparations = await f.service.preparations
        let purchases = await f.client.purchases
        XCTAssertEqual(preparations, 0); XCTAssertEqual(purchases, 0)
        XCTAssertNotNil(f.coordinator.quote)
    }

    func testChangedPriceRequiresAnotherPurchaseButtonTap() async {
        let f = await fixture()
        await f.service.setAmount(119_990)
        await f.client.setAmount(119_990)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
        XCTAssertEqual(f.coordinator.quote?.quote.priceMilliunits, 119_990)
        XCTAssertTrue(f.coordinator.message?.contains("price changed") == true)
    }

    func testButtonCannotAcceptAQuoteThatChangedBeforeItsTaskStarts() async {
        let f = await fixture()
        let displayedQuote = f.coordinator.quote
        await f.service.setAmount(119_990)
        await f.client.setAmount(119_990)
        await f.coordinator.refreshQuote()
        await f.coordinator.purchase(accepting: displayedQuote)
        let rejectedPreparations = await f.service.preparations
        XCTAssertEqual(rejectedPreparations, 0)
        XCTAssertTrue(f.coordinator.message?.contains("price changed") == true)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 1)
    }

    func testStoreKitPriceMismatchCannotShowOrStartAnOffer() async {
        let f = await fixture()
        await f.client.setAmount(68_000)
        await f.coordinator.refreshQuote()
        XCTAssertNil(f.coordinator.quote)
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let purchases = await f.client.purchases
        XCTAssertEqual(purchases, 0)
    }

    func testStoreKitReceivesTheExactDisplayedMoneyAndCurrency() async {
        let f = await fixture(environment: .sandbox)
        let displayed = f.coordinator.product
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let expectedProduct = await f.client.expectedProduct
        XCTAssertEqual(expectedProduct, displayed)
        XCTAssertEqual(expectedProduct?.priceMilliunits, 99_990)
        XCTAssertEqual(expectedProduct?.currencyCode, "USD")
        XCTAssertEqual(expectedProduct?.displayPriceWithCurrency, "USD $99.99")
    }

    func testChangedApplePriceAfterPreparationClosesOldOrderWithoutReceiptIntake() async {
        let f = await fixture(environment: .sandbox)
        await f.service.pauseNextPreparation()
        let purchase = Task { await f.coordinator.purchase(accepting: f.coordinator.quote) }
        for _ in 0..<1000 {
            if await f.service.waiting { break }
            await Task.yield()
        }
        let waiting = await f.service.waiting
        XCTAssertTrue(waiting)
        await f.client.setAmount(119_990)
        await f.client.setOutcome(.quoteChanged)
        await f.service.resumePreparation()
        await purchase.value
        let expectedProduct = await f.client.expectedProduct
        let actions = await f.service.actions
        let submissions = await f.service.submissions
        let finishes = await f.client.finishes
        XCTAssertEqual(expectedProduct?.priceMilliunits, 99_990)
        XCTAssertEqual(actions, ["start", "cancel"])
        XCTAssertEqual(submissions, 0)
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertNil(f.coordinator.pending)
        XCTAssertNil(f.coordinator.quote)
        XCTAssertTrue(f.coordinator.message?.contains("price changed") == true)
        XCTAssertFalse(f.coordinator.busy)
    }

    func testChangedQuoteReturnsTheNewPriceForFreshConsent() async {
        let f = await fixture()
        await f.service.pauseNextPreparation()
        let purchase = Task { await f.coordinator.purchase(accepting: f.coordinator.quote) }
        for _ in 0..<1000 {
            if await f.service.waiting { break }
            await Task.yield()
        }
        await f.service.setAmount(119_990)
        await f.client.setAmount(119_990)
        await f.client.setOutcome(.quoteChanged)
        await f.service.resumePreparation()
        await purchase.value
        XCTAssertEqual(f.coordinator.quote?.quote.priceMilliunits, 119_990)
        XCTAssertEqual(f.coordinator.product?.displayPriceWithCurrency, "USD $119.99")
        XCTAssertNil(f.coordinator.pending)
        XCTAssertTrue(f.coordinator.message?.contains("price changed") == true)
        let submissions = await f.service.submissions
        XCTAssertEqual(submissions, 0)
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
        await f.coordinator.purchase(accepting: f.coordinator.quote)
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
        await f.coordinator.purchase(accepting: f.coordinator.quote)
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
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let firstActions = await f.service.actions
        XCTAssertEqual(firstActions, ["start", "pending"])
        await f.coordinator.purchase(accepting: f.coordinator.quote)
        let stillPending = await f.service.actions
        XCTAssertEqual(stillPending, ["start", "pending"])
        let canceled = await fixture()
        await canceled.client.setOutcome(.userCancelled)
        await canceled.coordinator.purchase(accepting: canceled.coordinator.quote)
        let actions = await canceled.service.actions
        let finishes = await canceled.client.finishes
        XCTAssertEqual(actions, ["start", "cancel"])
        XCTAssertTrue(finishes.isEmpty)
    }

    func testAccountChangeDuringPreparationCannotOpenAnotherOwnersPaymentSheet() async {
        let f = await fixture()
        await f.service.pauseNextPreparation()
        let purchase = Task { await f.coordinator.purchase(accepting: f.coordinator.quote) }
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
        let purchase = Task { await f.coordinator.purchase(accepting: f.coordinator.quote) }
        for _ in 0..<1000 {
            if await f.service.receiptWaiting { break }
            await Task.yield()
        }
        let waiting = await f.service.receiptWaiting
        XCTAssertTrue(waiting)
        f.coordinator.reset()
        await f.coordinator.start(owner: UUID())
        let newAccountMessage = f.coordinator.message
        XCTAssertTrue(newAccountMessage?.contains("originally used") == true)
        await f.service.resumeReceipt()
        await purchase.value
        let finishes = await f.client.finishes
        XCTAssertTrue(finishes.isEmpty)
        XCTAssertEqual(f.coordinator.message, newAccountMessage)
    }

    func testReviewPurchaseUsesSandboxContractAndNeverFinishesOnProductionAcknowledgement() async {
        let f = await fixture(environment: .sandbox)
        XCTAssertEqual(f.coordinator.environment, .sandbox)
        XCTAssertNotNil(f.coordinator.quote)
        await f.service.useWrongReceiptEnvironment()
        await f.coordinator.purchase(accepting: f.coordinator.quote)
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
        await unknown.coordinator.purchase(accepting: unknown.coordinator.quote)
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
        await f.coordinator.purchase(accepting: f.coordinator.quote)
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

private actor ApplePurchaseServiceSpy: CommerceServing {
    let owner: UUID
    var purchaseToken: UUID?
    func usePurchaseToken(_ value: UUID) { purchaseToken = value }
    var amount = 99_990
    var quoteReads = 0, statusReads = 0
    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        statusReads += 1
        return CommerceStatus(contractVersion: "commerce-status-v1", billingOpen: false,
            serviceMarketCode: serviceMarketCode, marketPolicyVersion: 1,
            currentAccess: .init(planCode: "free", planVersion: 1, subscription: nil, managementDestination: "none"),
            entitlements: [], plans: [], offers: [], boundaries: boundaries)
    }
    func resolvePurchaseRoute(request: CommercePurchaseRouteRequest) async throws -> CommercePurchaseRouteResponse {
        CommercePurchaseRouteResponse(contractVersion: "commerce-purchase-route-v1", purchaseRoute: "none",
            reason: "fixture", policy: nil, activeSubscription: nil, managementDestination: "none",
            requiresFreshEvaluation: true, boundaries: boundaries)
    }
    private var boundaries: CommerceBoundaries {
        CommerceBoundaries(serverAuthoritative: true, providerCallbackGrantsAccess: false,
            clientPurchaseResultGrantsAccess: false, billingStateCanTriggerClaim: false,
            billingStateCanTriggerDisclosure: false, storefrontPersistedToCustomerProfile: false,
            oneActiveRenewalProviderPerHouseholdPlan: true)
    }
    let environment: ApplePurchaseEnvironment
    var submittedEnvironments: [ApplePurchaseEnvironment] = []
    var wrongReceiptEnvironment = false
    func useWrongReceiptEnvironment() { wrongReceiptEnvironment = true }
    func useCorrectReceiptEnvironment() { wrongReceiptEnvironment = false }
    var rejectQuotes = false
    func rejectNewQuotes() { rejectQuotes = true }
    var preparations = 0, submissions = 0
    var preparedNonces: [UUID] = []
    var actions: [String] = []
    var finished = true, inconsistent = false, pause = false
    var continuation: CheckedContinuation<ApplePurchaseIntent, Never>?
    var receiptContinuation: CheckedContinuation<AppleTransactionResponse, Never>?
    var pendingContinuation: CheckedContinuation<ApplePendingPurchaseResponse, Never>?
    var pausedPendingResponse: ApplePendingPurchaseResponse?
    var pausePending = false
    var pendingWaiting: Bool { pendingContinuation != nil }
    func pauseNextPending() { pausePending = true }
    func resumePending() {
        if let pausedPendingResponse { pendingContinuation?.resume(returning: pausedPendingResponse) }
        pendingContinuation = nil; pausedPendingResponse = nil
    }
    var pauseReceipt = false
    var currentPurchase: ApplePendingPurchase?
    var rejectOwner = false
    func rejectReceiptOwner() { rejectOwner = true }
    func seedPending(token: UUID) {
        purchaseToken = token
        currentPurchase = ApplePendingPurchase(orderReference: UUID(), nonce: UUID(), state: "started")
    }
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
        quoteReads += 1
        if rejectQuotes { throw RilloraAPIError.invalidResponse }
        return AppleQuoteResponse(contractVersion: "commerce-apple-purchase-v1", quote: ApplePurchaseQuote(bindingCode: "fixture",
            priceCode: "family_fixture", productId: RilloraStoreKitCatalog.familyAnnualProductID,
            serviceMarketCode: serviceMarket, storefrontCountryCode: storefront, currency: "USD",
            amountMinor: amount / 10, minorUnitExponent: 2, priceMilliunits: amount, billingPeriod: "annual"),
            purchaseTerms: ApplePurchaseTerms(version: "family-annual-apple-20261009-1",
                termsVersion: LegalAcceptanceProof.current.termsVersion, subscriptionTermsVersion: "subscriptions-2026-08-27-1",
                refundPolicyVersion: "refunds-2026-08-27-1", legalBundleSha256: LegalAcceptanceProof.current.bundleSha256),
            requiresFreshEvaluation: true, environment: environment, validationOnly: environment == .sandbox)
    }
    func prepareApplePurchase(_ preparation: ApplePurchasePreparation, nonce: UUID, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseIntent {
        guard preparation.expectedAppAccountToken == owner else { throw RilloraAPIError.invalidResponse }
        preparations += 1
        preparedNonces.append(nonce)
        currentPurchase = ApplePendingPurchase(orderReference: UUID(), nonce: nonce, state: "prepared")
        if pause { return await withCheckedContinuation { continuation = $0 } }
        return intent()
    }
    private func intent() -> ApplePurchaseIntent {
        ApplePurchaseIntent(contractVersion: "commerce-apple-purchase-v1", orderReference: currentPurchase?.orderReference ?? UUID(), appAccountToken: purchaseToken ?? owner, state: "prepared", grantsAccess: false, environment: environment, validationOnly: environment == .sandbox)
    }
    func changeApplePurchase(_ reference: UUID, action: String, environment: ApplePurchaseEnvironment) async throws -> ApplePurchaseState {
        actions.append(action)
        let state = action == "start" ? "started" : action == "pending" ? "pending" : "closed"
        if let existing = currentPurchase {
            currentPurchase = action == "cancel" ? nil : ApplePendingPurchase(orderReference: reference, nonce: existing.nonce, state: state)
        }
        return ApplePurchaseState(state: state)
    }
    func pendingApplePurchase(environment: ApplePurchaseEnvironment) async throws -> ApplePendingPurchaseResponse {
        let response = ApplePendingPurchaseResponse(purchase: currentPurchase, appAccountTokens: purchaseToken.map { [$0] })
        if pausePending {
            pausePending = false; pausedPendingResponse = response
            return await withCheckedContinuation { pendingContinuation = $0 }
        }
        return response
    }
    func submitAppleTransaction(_ evidence: StoreKitTransactionEvidence, environment: ApplePurchaseEnvironment) async throws -> AppleTransactionResponse {
        submissions += 1; submittedEnvironments.append(environment)
        if rejectOwner { throw RilloraAPIError.server(status: 409, code: "apple_purchase_owner_conflict", message: "Synthetic conflict", requestID: nil) }
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
    nonisolated private let updates: AsyncStream<StoreKitTransactionUpdate>?
    private let updateContinuation: AsyncStream<StoreKitTransactionUpdate>.Continuation?
    func emit(_ update: StoreKitTransactionUpdate) { updateContinuation?.yield(update) }
    func endUpdates() { updateContinuation?.finish() }
    var suppliedAccountToken: UUID?
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
    var expectedProduct: StoreKitProductSnapshot?
    var finishes: [UInt64] = []
    var history: StoreKitTransactionEvidence?
    var additionalCurrent: [StoreKitTransactionEvidence] = []
    func setAdditionalCurrent(_ values: [StoreKitTransactionEvidence]) { additionalCurrent = values }
    var unfinished: [StoreKitTransactionEvidence] = []
    var unfinishedUnverified = false
    var historical: [StoreKitSubscriptionStatusEvidence] = []
    func setUnfinished(_ values: [StoreKitTransactionEvidence], unverified: Bool = false) {
        unfinished = values; unfinishedUnverified = unverified
    }
    func setHistorical(_ value: StoreKitTransactionEvidence) {
        historical = [.init(transaction: value, state: .expired, willAutoRenew: false,
            isInBillingRetry: false, gracePeriodExpirationDate: nil, signedRenewalInfo: "synthetic.renewal.fixture")]
    }
    var nextOutcome: StoreKitPurchaseOutcome?
    var historyFailed = false
    var historyReads = 0
    var historyAfterSync: StoreKitTransactionEvidence?
    var pauseCatalog = false
    var catalogContinuation: CheckedContinuation<Void, Never>?
    var catalogWaiting: Bool { catalogContinuation != nil }
    func pauseNextCatalog() { pauseCatalog = true }
    func resumeCatalog() { catalogContinuation?.resume(); catalogContinuation = nil }
    func setHistoryAfterSync(_ value: StoreKitTransactionEvidence) { historyAfterSync = value }
    init(owner: UUID, environment: ApplePurchaseEnvironment?, observesUpdates: Bool = false) {
        self.owner = owner; self.appEnvironment = environment
        if observesUpdates {
            let pipe = AsyncStream<StoreKitTransactionUpdate>.makeStream()
            updates = pipe.stream; updateContinuation = pipe.continuation
        } else { updates = nil; updateContinuation = nil }
    }
    func setAmount(_ value: Int) { amount = value }
    func setHistory(_ value: StoreKitTransactionEvidence?) { history = value }
    func setOutcome(_ value: StoreKitPurchaseOutcome) { nextOutcome = value }
    func failHistory() { historyFailed = true }
    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        let products: [StoreKitProductSnapshot] = [.init(productID: RilloraStoreKitCatalog.familyAnnualProductID, displayName: "Fixture Family", description: "Synthetic",
            displayPrice: "$\(amount / 1000).99", subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            priceMilliunits: amount, currencyCode: "USD", oneYearSubscription: true)]
        if pauseCatalog {
            pauseCatalog = false
            await withCheckedContinuation { catalogContinuation = $0 }
        }
        return products
    }
    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        StoreKitEntitlementSnapshot(transactions: (history.map { [$0] } ?? []) + additionalCurrent, containsUnverifiedTransaction: false)
    }
    func subscriptionStatuses(identifiers: Set<String>) async -> StoreKitSubscriptionStatusSnapshot {
        historyReads += 1
        return .init(statuses: historical, containsUnverifiedStatus: false, loadFailed: historyFailed)
    }
    func unfinishedTransactions(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        .init(transactions: unfinished, containsUnverifiedTransaction: unfinishedUnverified)
    }
    func purchase(productID: String, appAccountToken: UUID, expectedStorefrontCountryCode: String?, expectedProduct: StoreKitProductSnapshot?) async throws -> StoreKitPurchaseOutcome {
        suppliedAccountToken = appAccountToken
        purchases += 1
        self.expectedProduct = expectedProduct
        if let nextOutcome { return nextOutcome }
        let value = evidence(owner: appAccountToken, environment: appEnvironment?.rawValue ?? "Unknown"); history = value; return .verified(value)
    }
    nonisolated func transactionUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitTransactionUpdate> {
        updates ?? AsyncStream { $0.finish() }
    }
    nonisolated func subscriptionStatusUpdates(identifiers: Set<String>) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> { AsyncStream { $0.finish() } }
    func finish(transactionID: UInt64) async { finishes.append(transactionID) }
    func sync() async throws { syncs += 1; if let historyAfterSync { history = historyAfterSync } }
}
private struct ApplePurchaseStorefrontFixture: CommerceStorefrontProviding {
    func currentCountryCode() async -> String? { "USA" }
    func countryCodeUpdates() -> AsyncStream<String> { AsyncStream { $0.finish() } }
}
private func evidence(owner: UUID?, product: String = RilloraStoreKitCatalog.familyAnnualProductID,
                      country: String = "USA", environment: String = "Production", id: UInt64 = 100) -> StoreKitTransactionEvidence {
    StoreKitTransactionEvidence(transactionID: id, originalTransactionID: id, productID: product,
        subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID, appAccountToken: owner,
        environment: environment, storefrontCountryCode: country, purchaseDate: .now,
        expirationDate: .now.addingTimeInterval(86400), revocationDate: nil, transactionReason: "PURCHASE",
        signedTransaction: "synthetic.transaction.fixture", isXcodeEnvironment: false)
}
