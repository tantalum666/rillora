import Foundation
import XCTest
@testable import Rillora

@MainActor
final class CommerceStoreTests: XCTestCase {
    func testCancelledPreviousAccountStartCannotResetNewPurchaseCoordinator() async {
        let suspended = expectation(description: "Previous account status request is in flight")
        let service = SuspendedFirstCommerceService(entered: suspended)
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: StubStoreKitClient(products: [], purchaseOutcome: .userCancelled,
                                             appEnvironment: .sandbox),
            serviceMarketCode: "GLOBAL_US", storeKitProductionEnabled: true
        )
        let previous = Task { await store.start(appAccountToken: UUID()) }
        await fulfillment(of: [suspended], timeout: 2)
        // Match the shell task cancellation and AuthenticationStore.reset on account change.
        previous.cancel()
        store.reset()
        await store.start(appAccountToken: UUID())
        XCTAssertEqual(store.applePurchase?.environment, .sandbox)

        await service.releaseFirstRequest()
        await previous.value
        XCTAssertEqual(store.applePurchase?.environment, .sandbox,
                       "A late previous-account request must not reset the new account's purchase state")
    }

    func testRetiredMonthlyProductCannotStartANewPurchase() async {
        let token = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let client = StubStoreKitClient(products: storeKitProducts,
                                       purchaseOutcome: .verified(storeKitEvidence(appAccountToken: token)))
        let store = CommerceStore(service: StubCommerceService(),
                                  storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
                                  storeKitClient: client, storeKitTestEnvironment: .xcodeLocal,
                                  serviceMarketCode: "GLOBAL_US")
        await store.start(appAccountToken: token)
        await store.purchaseLocalStoreKitProduct(productID: RilloraStoreKitCatalog.familyMonthlyProductID)
        XCTAssertEqual(store.storeKitProducts.map(\.productID), [RilloraStoreKitCatalog.familyAnnualProductID])
        XCTAssertTrue(store.storeKitLocalTransactions.isEmpty)
        let finished = await client.finishedTransactionIDs()
        XCTAssertTrue(finished.isEmpty)
        XCTAssertEqual(store.storeKitMessage, "The selected local StoreKit product is not available.")
    }

    func testRefreshRoutesWithCurrentStorefrontAndReevaluatesOnChange() async throws {
        let service = StubCommerceService()
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            serviceMarketCode: "GLOBAL_US"
        )

        await store.refresh()
        XCTAssertEqual(store.storefrontCountryCode, "USA")
        XCTAssertEqual(store.purchaseRoute?.policy?.code, "policy-USA")
        XCTAssertFalse(store.purchaseIsAvailable)

        await store.applyStorefrontUpdate("CHN")
        XCTAssertEqual(store.storefrontCountryCode, "CHN")
        XCTAssertEqual(store.purchaseRoute?.policy?.code, "policy-CHN")

        let requests = await service.routeRequests()
        XCTAssertEqual(requests.map(\.appleStorefrontCountryCode), ["USA", "CHN"])

        store.reset()
        XCTAssertNil(store.status)
        XCTAssertNil(store.purchaseRoute)
        XCTAssertNil(store.storefrontCountryCode)
    }

    func testMissingStorefrontFailsClosedWithoutCallingPurchaseRoute() async throws {
        let service = StubCommerceService()
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: nil),
            serviceMarketCode: "GLOBAL_US"
        )

        await store.refresh()

        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        XCTAssertNil(store.purchaseRoute)
        XCTAssertFalse(store.purchaseIsAvailable)
        let routeRequests = await service.routeRequests()
        XCTAssertTrue(routeRequests.isEmpty)
    }

    func testLocalStoreKitPurchaseFinishesOnlyAfterMatchingVerifiedEvidence() async throws {
        let service = StubCommerceService()
        let accountToken = try XCTUnwrap(UUID(uuidString: "11111111-1111-4111-8111-111111111111"))
        let transaction = storeKitEvidence(appAccountToken: accountToken)
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .verified(transaction)
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)
        await store.purchaseLocalStoreKitProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertEqual(store.storeKitProducts.map(\.productID), [RilloraStoreKitCatalog.familyAnnualProductID])
        XCTAssertEqual(store.storeKitLocalTransactions.map(\.transactionID), [9001])
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        XCTAssertFalse(store.purchaseIsAvailable)
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertEqual(finishedIDs, [9001])
        XCTAssertEqual(
            store.storeKitMessage,
            "StoreKit verified the local transaction. It changed no ordinary Rillora entitlement."
        )
    }

    func testLocalStoreKitPurchaseRejectsWrongAccountTokenWithoutFinishing() async throws {
        let service = StubCommerceService()
        let expectedToken = try XCTUnwrap(UUID(uuidString: "11111111-1111-4111-8111-111111111111"))
        let wrongToken = try XCTUnwrap(UUID(uuidString: "22222222-2222-4222-8222-222222222222"))
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .verified(storeKitEvidence(appAccountToken: wrongToken))
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: expectedToken)
        await store.purchaseLocalStoreKitProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertTrue(store.storeKitLocalTransactions.isEmpty)
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
        XCTAssertEqual(
            store.storeKitMessage,
            "The local transaction did not match the Rillora account, catalog, environment, or storefront. It was not finished."
        )
    }

    func testUnverifiedLocalStoreKitPurchaseNeverFinishes() async {
        let service = StubCommerceService()
        let accountToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .unverified
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)
        await store.purchaseLocalStoreKitProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertTrue(store.storeKitLocalTransactions.isEmpty)
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
        XCTAssertEqual(
            store.storeKitMessage,
            "StoreKit returned an unverified purchase. It was not recorded or finished."
        )
    }

    func testRestoreHistoricalMonthlyPurchaseStillRefreshesLocalEvidence() async {
        let service = StubCommerceService()
        let accountToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let entitlement = storeKitEvidence(appAccountToken: accountToken, productID: RilloraStoreKitCatalog.familyMonthlyProductID)
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .userCancelled,
            entitlements: StoreKitEntitlementSnapshot(
                transactions: [entitlement],
                containsUnverifiedTransaction: false
            )
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)
        await store.restoreLocalStoreKitPurchases()

        let syncCalls = await storeKitClient.syncCallCount()
        XCTAssertEqual(syncCalls, 1)
        XCTAssertEqual(store.storeKitLocalEntitlements.map(\.transactionID), [9001])
        XCTAssertEqual(store.storeKitLocalEntitlements.map(\.productID), [RilloraStoreKitCatalog.familyMonthlyProductID])
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
    }

    func testRestoreIgnoresEntitlementBoundToAnotherRilloraAccount() async {
        let service = StubCommerceService()
        let expectedToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let wrongToken = UUID(uuidString: "22222222-2222-4222-8222-222222222222")!
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .userCancelled,
            entitlements: StoreKitEntitlementSnapshot(
                transactions: [storeKitEvidence(appAccountToken: wrongToken)],
                containsUnverifiedTransaction: false
            )
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: expectedToken)

        XCTAssertTrue(store.storeKitLocalEntitlements.isEmpty)
        XCTAssertTrue(store.storeKitContainsMismatchedEntitlement)
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
    }

    func testMatchingTransactionUpdateIsRecordedAndFinishedWithoutChangingAccess() async {
        let service = StubCommerceService()
        let accountToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let evidence = storeKitEvidence(appAccountToken: accountToken)
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .userCancelled,
            updates: [.verified(evidence)]
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)

        XCTAssertEqual(store.storeKitLocalTransactions.map(\.transactionID), [9001])
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertEqual(finishedIDs, [9001])
    }

    func testLocalSubscriptionLifecycleStatesNeverMutateServerAccess() async throws {
        let accountToken = try XCTUnwrap(
            UUID(uuidString: "11111111-1111-4111-8111-111111111111")
        )
        let lifecycleStates: [StoreKitSubscriptionState] = [
            .subscribed,
            .inGracePeriod,
            .inBillingRetryPeriod,
            .expired,
            .revoked,
        ]

        for state in lifecycleStates {
            let storeKitClient = StubStoreKitClient(
                products: storeKitProducts,
                purchaseOutcome: .userCancelled,
                subscriptionStatuses: storeKitStatusSnapshot(
                    appAccountToken: accountToken,
                    state: state
                )
            )
            let store = CommerceStore(
                service: StubCommerceService(),
                storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
                storeKitClient: storeKitClient,
                storeKitTestEnvironment: .xcodeLocal,
                serviceMarketCode: "GLOBAL_US"
            )

            await store.start(appAccountToken: accountToken)

            XCTAssertEqual(store.storeKitLocalSubscriptionStatuses.map(\.state), [state])
            XCTAssertEqual(store.status?.currentAccess.planCode, "free")
            XCTAssertFalse(store.purchaseIsAvailable)
        }
    }

    func testSubscriptionStatusUpdateRefreshesLifecycleWithoutFinishingOrGrantingAccess() async {
        let accountToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let statusUpdate = storeKitStatusSnapshot(
            appAccountToken: accountToken,
            state: .inBillingRetryPeriod
        )
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .userCancelled,
            statusUpdates: [statusUpdate]
        )
        let store = CommerceStore(
            service: StubCommerceService(),
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)

        XCTAssertEqual(
            store.storeKitLocalSubscriptionStatuses.map(\.state),
            [.inBillingRetryPeriod]
        )
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
        XCTAssertEqual(
            store.storeKitMessage,
            "Local subscription state: billing retry. Ordinary Rillora access is unchanged."
        )
    }

    func testSubscriptionStatusOutsideLocalAccountIsIgnored() async {
        let expectedToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let wrongToken = UUID(uuidString: "22222222-2222-4222-8222-222222222222")!
        let storeKitClient = StubStoreKitClient(
            products: storeKitProducts,
            purchaseOutcome: .userCancelled,
            subscriptionStatuses: storeKitStatusSnapshot(
                appAccountToken: wrongToken,
                state: .subscribed
            )
        )
        let store = CommerceStore(
            service: StubCommerceService(),
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .xcodeLocal,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: expectedToken)

        XCTAssertTrue(store.storeKitLocalSubscriptionStatuses.isEmpty)
        XCTAssertTrue(store.storeKitContainsMismatchedSubscriptionStatus)
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
    }

    func testSandboxCatalogLoadsAppStoreGroupWithoutOpeningPurchasePath() async {
        let accountToken = UUID(uuidString: "11111111-1111-4111-8111-111111111111")!
        let storeKitClient = StubStoreKitClient(
            products: sandboxStoreKitProducts,
            purchaseOutcome: .verified(storeKitEvidence(appAccountToken: accountToken))
        )
        let store = CommerceStore(
            service: StubCommerceService(),
            storefrontProvider: StubCommerceStorefrontProvider(current: "HKG"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .appStoreSandboxCatalog,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start(appAccountToken: accountToken)
        await store.purchaseLocalStoreKitProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertEqual(store.storeKitProducts.map(\.productID), [RilloraStoreKitCatalog.familyAnnualProductID])
        XCTAssertTrue(store.storeKitSandboxCatalogTestingEnabled)
        XCTAssertFalse(store.storeKitLocalTestingEnabled)
        XCTAssertTrue(store.storeKitLocalTransactions.isEmpty)
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
    }

    func testSandboxCatalogDiagnosticLoadsWithoutAPrivateCommerceSession() async {
        let store = CommerceStore(
            service: StubCommerceService(),
            storefrontProvider: StubCommerceStorefrontProvider(current: "HKG"),
            storeKitClient: StubStoreKitClient(
                products: sandboxStoreKitProducts,
                purchaseOutcome: .userCancelled
            ),
            storeKitTestEnvironment: .appStoreSandboxCatalog,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.startSandboxCatalog()

        XCTAssertNil(store.status)
        XCTAssertNil(store.purchaseRoute)
        XCTAssertEqual(store.storefrontCountryCode, "HKG")
        XCTAssertEqual(store.storeKitProducts.map(\.productID), [RilloraStoreKitCatalog.familyAnnualProductID])
        XCTAssertFalse(store.purchaseIsAvailable)
    }

    func testSandboxPurchaseFinishesOnlyAfterDurableServerAuthorization() async throws {
        let accountToken = try XCTUnwrap(
            UUID(uuidString: "11111111-1111-4111-8111-111111111111")
        )
        let service = StubCommerceService(
            sandboxResponse: storeKitSandboxResponse(
                status: "applied",
                finishAuthorized: true,
                authoritativeSnapshotLoaded: true
            )
        )
        let evidence = sandboxStoreKitEvidence(appAccountToken: accountToken)
        let storeKitClient = StubStoreKitClient(
            products: sandboxStoreKitProducts,
            purchaseOutcome: .verified(evidence)
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .appStoreSandboxPurchase,
            storeKitTestAppAccountToken: accountToken,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.startSandboxCatalog()
        await store.purchaseStoreKitSandboxProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertTrue(store.storeKitSandboxPurchaseTestingEnabled)
        XCTAssertEqual(store.storeKitSandboxTransactions.map(\.transactionID), [9002])
        XCTAssertEqual(store.storeKitSandboxServerStatus, "applied")
        XCTAssertFalse(store.storeKitSandboxTransactionPending)
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        let submittedRequests = await service.sandboxRequests()
        XCTAssertEqual(finishedIDs, [9002])
        XCTAssertEqual(submittedRequests.count, 1)
        XCTAssertEqual(store.status?.currentAccess.planCode, nil)
        XCTAssertEqual(
            store.storeKitMessage,
            "Apple and the Rillora server verified the Sandbox subscription. The transaction was finished after durable acknowledgement; ordinary access remains Free."
        )
    }

    func testSandboxPurchaseRemainsUnfinishedWhileAuthoritativeSnapshotIsPending() async {
        let accountToken = UUID(
            uuidString: "11111111-1111-4111-8111-111111111111"
        )!
        let service = StubCommerceService(
            sandboxResponse: storeKitSandboxResponse(
                status: "needs_authoritative_snapshot",
                finishAuthorized: false,
                authoritativeSnapshotLoaded: false
            )
        )
        let storeKitClient = StubStoreKitClient(
            products: sandboxStoreKitProducts,
            purchaseOutcome: .verified(
                sandboxStoreKitEvidence(appAccountToken: accountToken)
            )
        )
        let store = CommerceStore(
            service: service,
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: storeKitClient,
            storeKitTestEnvironment: .appStoreSandboxPurchase,
            storeKitTestAppAccountToken: accountToken,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.startSandboxCatalog()
        await store.purchaseStoreKitSandboxProduct(
            productID: RilloraStoreKitCatalog.familyAnnualProductID
        )

        XCTAssertTrue(store.storeKitSandboxTransactions.isEmpty)
        XCTAssertEqual(store.storeKitSandboxServerStatus, "needs_authoritative_snapshot")
        XCTAssertTrue(store.storeKitSandboxTransactionPending)
        let finishedIDs = await storeKitClient.finishedTransactionIDs()
        XCTAssertTrue(finishedIDs.isEmpty)
        XCTAssertEqual(
            store.storeKitMessage,
            "Apple verified the Sandbox transaction, but the authoritative server snapshot is still pending. The transaction remains unfinished."
        )
    }

    func testSandboxCatalogRejectsXcodeLocalSubscriptionGroup() async {
        let store = CommerceStore(
            service: StubCommerceService(),
            storefrontProvider: StubCommerceStorefrontProvider(current: "USA"),
            storeKitClient: StubStoreKitClient(
                products: storeKitProducts,
                purchaseOutcome: .userCancelled
            ),
            storeKitTestEnvironment: .appStoreSandboxCatalog,
            serviceMarketCode: "GLOBAL_US"
        )

        await store.start()

        XCTAssertTrue(store.storeKitProducts.isEmpty)
        XCTAssertEqual(
            store.storeKitMessage,
            "The App Store Sandbox catalog is incomplete or belongs to another subscription group. Purchases remain unavailable."
        )
        XCTAssertEqual(store.status?.currentAccess.planCode, "free")
    }
}

private let storeKitProducts = [
    StoreKitProductSnapshot(
        productID: RilloraStoreKitCatalog.familyAnnualProductID,
        displayName: "Rillora Family Yearly",
        description: "Local yearly product",
        displayPrice: "$99.00",
        subscriptionGroupID: RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
    ),
    StoreKitProductSnapshot(
        productID: RilloraStoreKitCatalog.familyMonthlyProductID,
        displayName: "Rillora Family Monthly",
        description: "Local monthly product",
        displayPrice: "$9.99",
        subscriptionGroupID: RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
    ),
]

private let sandboxStoreKitProducts = storeKitProducts.map {
    StoreKitProductSnapshot(
        productID: $0.productID,
        displayName: $0.displayName,
        description: $0.description,
        displayPrice: $0.displayPrice,
        subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID
    )
}

private func storeKitEvidence(appAccountToken: UUID?, productID: String = RilloraStoreKitCatalog.familyAnnualProductID) -> StoreKitTransactionEvidence {
    StoreKitTransactionEvidence(
        transactionID: 9001,
        originalTransactionID: 8001,
        productID: productID,
        subscriptionGroupID: RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID,
        appAccountToken: appAccountToken,
        environment: "Xcode",
        storefrontCountryCode: "USA",
        purchaseDate: Date(timeIntervalSince1970: 1_700_000_000),
        expirationDate: Date(timeIntervalSince1970: 1_800_000_000),
        revocationDate: nil,
        transactionReason: "PURCHASE",
        signedTransaction: "header.payload.signature",
        isXcodeEnvironment: true
    )
}

private func sandboxStoreKitEvidence(
    appAccountToken: UUID?
) -> StoreKitTransactionEvidence {
    StoreKitTransactionEvidence(
        transactionID: 9002,
        originalTransactionID: 8002,
        productID: RilloraStoreKitCatalog.familyAnnualProductID,
        subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
        appAccountToken: appAccountToken,
        environment: "Sandbox",
        storefrontCountryCode: "USA",
        purchaseDate: Date(timeIntervalSince1970: 1_700_000_000),
        expirationDate: Date(timeIntervalSince1970: 1_800_000_000),
        revocationDate: nil,
        transactionReason: "PURCHASE",
        signedTransaction: "header.sandbox.signature",
        isXcodeEnvironment: false
    )
}

private func storeKitSandboxResponse(
    status: String,
    finishAuthorized: Bool,
    authoritativeSnapshotLoaded: Bool
) -> StoreKitSandboxTransactionResponse {
    StoreKitSandboxTransactionResponse(
        contractVersion: "commerce-storekit-sandbox-v1",
        result: StoreKitSandboxTransactionResult(
            accepted: true,
            status: status,
            providerEventReference: "9002",
            finishAuthorized: finishAuthorized,
            authoritativeSnapshotLoaded: authoritativeSnapshotLoaded,
            entitlementChanged: false,
            sandboxOnly: true
        ),
        boundaries: StoreKitSandboxTransactionBoundaries(
            sandboxOnly: true,
            serverAuthoritative: true,
            authoritativeSnapshotLoaded: authoritativeSnapshotLoaded,
            transactionFinishAuthorized: finishAuthorized,
            entitlementMutationEnabled: false,
            purchaseRouteEnabled: false
        )
    )
}

private func storeKitStatusSnapshot(
    appAccountToken: UUID?,
    state: StoreKitSubscriptionState
) -> StoreKitSubscriptionStatusSnapshot {
    StoreKitSubscriptionStatusSnapshot(
        statuses: [
            StoreKitSubscriptionStatusEvidence(
                transaction: storeKitEvidence(appAccountToken: appAccountToken),
                state: state,
                willAutoRenew: state == .subscribed || state == .inGracePeriod,
                isInBillingRetry: state == .inBillingRetryPeriod || state == .inGracePeriod,
                gracePeriodExpirationDate: state == .inGracePeriod
                    ? Date(timeIntervalSince1970: 1_750_000_000)
                    : nil,
                signedRenewalInfo: "header.renewal.signature"
            ),
        ],
        containsUnverifiedStatus: false,
        loadFailed: false
    )
}

private actor StubStoreKitClient: StoreKitPurchasing {
    private let appEnvironment: ApplePurchaseEnvironment?
    private let products: [StoreKitProductSnapshot]
    private let purchaseOutcome: StoreKitPurchaseOutcome
    private let entitlements: StoreKitEntitlementSnapshot
    private let subscriptionStatusSnapshot: StoreKitSubscriptionStatusSnapshot
    nonisolated private let updates: [StoreKitTransactionUpdate]
    nonisolated private let statusUpdates: [StoreKitSubscriptionStatusSnapshot]
    private var finishedIDs: [UInt64] = []
    private var syncCalls = 0

    init(
        products: [StoreKitProductSnapshot],
        purchaseOutcome: StoreKitPurchaseOutcome,
        entitlements: StoreKitEntitlementSnapshot = StoreKitEntitlementSnapshot(
            transactions: [],
            containsUnverifiedTransaction: false
        ),
        subscriptionStatuses: StoreKitSubscriptionStatusSnapshot = .empty,
        updates: [StoreKitTransactionUpdate] = [],
        statusUpdates: [StoreKitSubscriptionStatusSnapshot] = [],
        appEnvironment: ApplePurchaseEnvironment? = nil
    ) {
        self.products = products
        self.purchaseOutcome = purchaseOutcome
        self.entitlements = entitlements
        self.subscriptionStatusSnapshot = subscriptionStatuses
        self.updates = updates
        self.statusUpdates = statusUpdates
        self.appEnvironment = appEnvironment
    }

    func verifiedAppEnvironment() async -> ApplePurchaseEnvironment? { appEnvironment }

    func loadProducts(identifiers: Set<String>) async throws -> [StoreKitProductSnapshot] {
        products.filter { identifiers.contains($0.productID) }
    }

    func currentEntitlements(identifiers: Set<String>) async -> StoreKitEntitlementSnapshot {
        StoreKitEntitlementSnapshot(
            transactions: entitlements.transactions.filter { identifiers.contains($0.productID) },
            containsUnverifiedTransaction: entitlements.containsUnverifiedTransaction
        )
    }

    func subscriptionStatuses(
        identifiers: Set<String>
    ) async -> StoreKitSubscriptionStatusSnapshot {
        StoreKitSubscriptionStatusSnapshot(
            statuses: subscriptionStatusSnapshot.statuses.filter {
                identifiers.contains($0.transaction.productID)
            },
            containsUnverifiedStatus: subscriptionStatusSnapshot.containsUnverifiedStatus,
            loadFailed: subscriptionStatusSnapshot.loadFailed
        )
    }

    func purchase(
        productID: String,
        appAccountToken: UUID,
        expectedStorefrontCountryCode: String?,
        expectedProduct: StoreKitProductSnapshot?
    ) async throws -> StoreKitPurchaseOutcome {
        purchaseOutcome
    }

    nonisolated func transactionUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitTransactionUpdate> {
        AsyncStream { continuation in
            for update in updates {
                continuation.yield(update)
            }
            continuation.finish()
        }
    }

    nonisolated func subscriptionStatusUpdates(
        identifiers: Set<String>
    ) -> AsyncStream<StoreKitSubscriptionStatusSnapshot> {
        AsyncStream { continuation in
            for update in statusUpdates {
                continuation.yield(update)
            }
            continuation.finish()
        }
    }

    func finish(transactionID: UInt64) async {
        finishedIDs.append(transactionID)
    }

    func sync() async throws {
        syncCalls += 1
    }

    func finishedTransactionIDs() -> [UInt64] { finishedIDs }
    func syncCallCount() -> Int { syncCalls }
}

private actor StubCommerceService: CommerceServing {
    private var requests: [CommercePurchaseRouteRequest] = []
    private var submittedSandboxRequests: [StoreKitSandboxTransactionRequest] = []
    private let sandboxResponse: StoreKitSandboxTransactionResponse

    init(
        sandboxResponse: StoreKitSandboxTransactionResponse = storeKitSandboxResponse(
            status: "applied",
            finishAuthorized: true,
            authoritativeSnapshotLoaded: true
        )
    ) {
        self.sandboxResponse = sandboxResponse
    }

    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        CommerceStatus(
            contractVersion: "commerce-v1",
            billingOpen: false,
            serviceMarketCode: serviceMarketCode,
            marketPolicyVersion: 1,
            currentAccess: CommerceCurrentAccess(
                planCode: "free",
                planVersion: 1,
                subscription: nil,
                managementDestination: "none"
            ),
            entitlements: [],
            plans: [],
            offers: [],
            boundaries: .safeFixture
        )
    }

    func resolvePurchaseRoute(
        request: CommercePurchaseRouteRequest
    ) async throws -> CommercePurchaseRouteResponse {
        requests.append(request)
        return CommercePurchaseRouteResponse(
            contractVersion: "commerce-v1",
            purchaseRoute: "none",
            reason: "billing_closed",
            policy: CommerceRoutePolicy(
                code: "policy-\(request.appleStorefrontCountryCode)",
                version: 1,
                externalOfferAllowed: false
            ),
            activeSubscription: nil,
            managementDestination: "none",
            requiresFreshEvaluation: true,
            boundaries: .safeFixture
        )
    }

    func submitStoreKitSandboxTransaction(
        request: StoreKitSandboxTransactionRequest
    ) async throws -> StoreKitSandboxTransactionResponse {
        submittedSandboxRequests.append(request)
        return sandboxResponse
    }

    func routeRequests() -> [CommercePurchaseRouteRequest] { requests }
    func sandboxRequests() -> [StoreKitSandboxTransactionRequest] {
        submittedSandboxRequests
    }
}

private actor SuspendedFirstCommerceService: CommerceServing {
    private let entered: XCTestExpectation
    private let base = StubCommerceService()
    private var first = true
    private var continuation: CheckedContinuation<Void, Never>?

    init(entered: XCTestExpectation) { self.entered = entered }

    func fetchCommerceStatus(serviceMarketCode: String) async throws -> CommerceStatus {
        if first {
            first = false
            await withCheckedContinuation { continuation in
                self.continuation = continuation
                entered.fulfill()
            }
        }
        return try await base.fetchCommerceStatus(serviceMarketCode: serviceMarketCode)
    }

    func resolvePurchaseRoute(request: CommercePurchaseRouteRequest) async throws -> CommercePurchaseRouteResponse {
        try await base.resolvePurchaseRoute(request: request)
    }

    func releaseFirstRequest() {
        continuation?.resume()
        continuation = nil
    }
}

private struct StubCommerceStorefrontProvider: CommerceStorefrontProviding {
    let current: String?

    func currentCountryCode() async -> String? { current }

    func countryCodeUpdates() -> AsyncStream<String> {
        AsyncStream { continuation in continuation.finish() }
    }
}

private extension CommerceBoundaries {
    static let safeFixture = CommerceBoundaries(
        serverAuthoritative: true,
        providerCallbackGrantsAccess: false,
        clientPurchaseResultGrantsAccess: false,
        billingStateCanTriggerClaim: false,
        billingStateCanTriggerDisclosure: false,
        storefrontPersistedToCustomerProfile: false,
        oneActiveRenewalProviderPerHouseholdPlan: true
    )
}
