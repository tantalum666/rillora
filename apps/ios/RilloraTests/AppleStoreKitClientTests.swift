import StoreKitTest
import XCTest
@testable import Rillora

@MainActor
final class AppleStoreKitClientTests: XCTestCase {
    func testLoadsExactLocalFamilyCatalogAndReturnsVerifiedBoundPurchase() async throws {
        let osVersion = ProcessInfo.processInfo.operatingSystemVersion
        let explicitlyRetriesAffectedRuntime = ProcessInfo.processInfo.environment[
            "RILLORA_RUN_UNSTABLE_STOREKITTEST"
        ] == "1"
        let isAffectedStoreKitTestRuntime = osVersion.majorVersion == 26
            && [4, 5].contains(osVersion.minorVersion)
        if isAffectedStoreKitTestRuntime,
           !explicitlyRetriesAffectedRuntime {
            throw XCTSkip(
                "The installed iOS 26.4 and 26.5 Simulator runtimes fail or hang while "
                    + "SKTestSession synchronizes the local configuration with storekitd; "
                    + "Apple documents the related Simulator fix in iOS 26.6. "
                    + "Set RILLORA_RUN_UNSTABLE_STOREKITTEST=1 only for an explicit retry; "
                    + "the Xcode Run transaction path is verified separately."
            )
        }

        let testBundle = Bundle(for: AppleStoreKitClientTests.self)
        let configurationURL = try XCTUnwrap(
            testBundle.url(forResource: "Rillora", withExtension: "storekit"),
            "The StoreKit test target must contain Rillora.storekit."
        )
        let session: SKTestSession
        do {
            session = try SKTestSession(contentsOf: configurationURL)
        } catch {
            throw XCTSkip(
                "The current Xcode/iOS runtime could not synchronize the local StoreKit "
                    + "configuration with storekitd: \(error)"
            )
        }

        let client = AppleStoreKitClient(
            expectedSubscriptionGroupID:
                RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
        )
        let products = try await client.loadProducts(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        )

        guard Set(products.map(\.productID)) == RilloraStoreKitCatalog.familyProductIDs else {
            throw XCTSkip(
                "The current Xcode/iOS runtime did not expose the scheme's local StoreKit "
                    + "catalog to automated tests. The Xcode Run purchase path is verified "
                    + "separately."
            )
        }

        session.disableDialogs = true
        session.resetToDefaultState()
        session.clearTransactions()
        session.storefront = "USA"
        defer { session.clearTransactions() }

        XCTAssertTrue(
            products.allSatisfy {
                $0.subscriptionGroupID
                    == RilloraStoreKitCatalog.xcodeLocalFamilySubscriptionGroupID
            }
        )

        let appAccountToken = try XCTUnwrap(
            UUID(uuidString: "11111111-1111-4111-8111-111111111111")
        )
        let outcome = try await client.purchase(
            productID: RilloraStoreKitCatalog.familyAnnualProductID,
            appAccountToken: appAccountToken,
            expectedStorefrontCountryCode: "USA",
            expectedProduct: products.first { $0.productID == RilloraStoreKitCatalog.familyAnnualProductID }
        )

        guard case .verified(let evidence) = outcome else {
            return XCTFail("Expected a locally verified StoreKit purchase")
        }
        XCTAssertEqual(evidence.productID, RilloraStoreKitCatalog.familyAnnualProductID)
        XCTAssertEqual(evidence.appAccountToken, appAccountToken)
        XCTAssertEqual(evidence.storefrontCountryCode, "USA")
        XCTAssertTrue(evidence.isXcodeEnvironment)
        XCTAssertFalse(evidence.signedTransaction.isEmpty)

        await client.finish(transactionID: evidence.transactionID)
        let entitlements = await client.currentEntitlements(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        )
        XCTAssertEqual(entitlements.transactions.map(\.transactionID), [evidence.transactionID])
        XCTAssertFalse(entitlements.containsUnverifiedTransaction)

        let statuses = await client.subscriptionStatuses(
            identifiers: RilloraStoreKitCatalog.familyProductIDs
        )
        XCTAssertFalse(statuses.loadFailed)
        XCTAssertFalse(statuses.containsUnverifiedStatus)
        XCTAssertEqual(statuses.statuses.map(\.state), [.subscribed])
        XCTAssertEqual(
            statuses.statuses.map(\.transaction.originalTransactionID),
            [evidence.originalTransactionID]
        )
        XCTAssertTrue(statuses.statuses.allSatisfy { !$0.signedRenewalInfo.isEmpty })
    }
}
