import Foundation
import XCTest
@testable import Rillora

final class MatterListPresentationTests: XCTestCase {
    func testEveryCategoryHasOneFilterAndUsesItsRawCategory() {
        XCTAssertEqual(MatterListPresentation.categories, [
            .account, .document, .device, .financialAsset, .debt, .subscription, .cryptoAsset,
        ])
        XCTAssertEqual(Set(MatterListPresentation.categories.map(\.rawValue)), Set(MatterCategory.allCases.map(\.rawValue)))
        let matters = MatterCategory.allCases.map { fixture(id: $0.rawValue, category: $0.rawValue) }
        for category in MatterCategory.allCases {
            let result = MatterListPresentation.filteredMatters(matters, categoryID: category.rawValue, query: "")
            XCTAssertEqual(result.map(\.publicId), [category.rawValue])
        }
        XCTAssertEqual(MatterListPresentation.filteredMatters(matters, categoryID: "all", query: ""), matters)
    }

    func testCategoryFilteringDoesNotUseOwnerOrSharedReviewStatus() {
        let matters = [
            fixture(id: "draft", category: "account", status: "draft"),
            fixture(id: "ready", category: "account", status: "ready"),
            fixture(id: "needs-review", category: "account", status: "needs_review"),
            fixture(id: "other", category: "document", status: "draft"),
        ]
        let result = MatterListPresentation.filteredMatters(matters, categoryID: "account", query: "")
        XCTAssertEqual(result.map(\.publicId), ["draft", "ready", "needs-review"])
    }

    func testSearchCombinesCategoryWithTrimmedTitleProviderAndRawCategory() {
        let account = fixture(id: "account", category: "account", title: "Photos %@ 私人内容", provider: "Example Cloud")
        let asset = fixture(id: "asset", category: "financial_asset", title: "Savings", provider: "Example Bank")
        let matters = [account, asset]
        for query in [" Photos ", "EXAMPLE CLOUD", "私人内容"] {
            XCTAssertEqual(MatterListPresentation.filteredMatters(matters, categoryID: "all", query: query), [account])
        }
        XCTAssertEqual(MatterListPresentation.filteredMatters(matters, categoryID: "all", query: "financial asset"), [asset])
        XCTAssertTrue(MatterListPresentation.filteredMatters(matters, categoryID: "account", query: "Savings").isEmpty)
        XCTAssertEqual(MatterListPresentation.filteredMatters(matters, categoryID: "all", query: " \n "), matters)
        XCTAssertEqual(account.title, "Photos %@ 私人内容")
    }

    func testSearchIncludesTranslatedCategoryLabelsAndKeepsUnknownCategoriesInAll() {
        let crypto = fixture(id: "crypto", category: "crypto_asset")
        let unknown = fixture(id: "future", category: "future_category")
        let result = MatterListPresentation.filteredMatters(
            [crypto, unknown], categoryID: "all", query: " 加密资产 ",
            categoryLabel: { $0 == .cryptoAsset ? "加密资产" : $0.label }
        )
        XCTAssertEqual(result, [crypto])
        XCTAssertEqual(MatterListPresentation.filteredMatters([crypto], categoryID: "all", query: MatterCategory.cryptoAsset.label), [crypto])
        XCTAssertEqual(MatterListPresentation.filteredMatters([unknown], categoryID: "all", query: "future category"), [unknown])
        XCTAssertNil(MatterListPresentation.requiredLocatorActionTitle(for: unknown))
    }

    func testProviderRequirementsReuseEachCategoryEditorRules() {
        for category in [MatterCategory.account, .financialAsset, .debt, .subscription] {
            let missing = fixture(category: category.rawValue, provider: " \n ")
            let complete = fixture(category: category.rawValue, provider: "Provider")
            XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: missing), L10n.format("Add %1$@", category.providerTitle.lowercased()))
            XCTAssertNil(MatterListPresentation.requiredLocatorActionTitle(for: complete))
        }
    }

    func testDocumentAndDeviceRequireLocationButNotProvider() {
        for category in [MatterCategory.document, .device] {
            let missing = fixture(category: category.rawValue, provider: "Issuer", location: "  ")
            let complete = fixture(category: category.rawValue, provider: nil, location: "Blue folder")
            XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: missing), String(localized: "Add where to find it"))
            XCTAssertNil(MatterListPresentation.requiredLocatorActionTitle(for: complete))
        }
    }

    func testCryptoNextActionFollowsCustodyAndRequiredPublicLocators() {
        let missingCustody = fixture(category: "crypto_asset")
        XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: missingCustody), String(localized: "Choose crypto storage type"))
        let exchange = fixture(category: "crypto_asset", details: ["cryptoCustody": "exchange"])
        XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: exchange), L10n.format("Add %1$@", MatterCategory.cryptoAsset.providerTitle.lowercased()))
        XCTAssertNil(MatterListPresentation.requiredLocatorActionTitle(for: fixture(category: "crypto_asset", provider: "Exchange", details: ["cryptoCustody": "exchange"])))
        let noNetwork = fixture(category: "crypto_asset", details: ["cryptoCustody": "self_custody"])
        XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: noNetwork), L10n.format("Add %1$@", String(localized: "Blockchain network").lowercased()))
        let noAddress = fixture(category: "crypto_asset", details: ["cryptoCustody": "self_custody", "network": "Ethereum", "walletAddress": " \n "])
        XCTAssertEqual(MatterListPresentation.requiredLocatorActionTitle(for: noAddress), L10n.format("Add %1$@", String(localized: "Public wallet address").lowercased()))
        let complete = fixture(category: "crypto_asset", details: ["cryptoCustody": "self_custody", "network": "Ethereum", "walletAddress": "0x1234"])
        XCTAssertNil(MatterListPresentation.requiredLocatorActionTitle(for: complete))
    }

    func testNextActionDependsOnMissingLocatorNotReadinessOrOptionalChoices() {
        let completeDraft = fixture(id: "draft", category: "account", provider: "Provider", status: "draft")
        let completeReview = fixture(id: "review", category: "document", location: "Folder", status: "needs_review")
        let missingReady = fixture(id: "ready", category: "document", status: "ready")
        XCTAssertNil(MatterListPresentation.nextAction(in: []))
        XCTAssertNil(MatterListPresentation.nextAction(in: [completeDraft, completeReview]))
        let next = MatterListPresentation.nextAction(in: [completeDraft, completeReview, missingReady])
        XCTAssertEqual(next?.matter, missingReady)
        XCTAssertEqual(next?.title, String(localized: "Add where to find it"))
        XCTAssertEqual(completeDraft.desiredOutcome, "undecided")
        XCTAssertEqual(completeReview.status, "needs_review")
        XCTAssertTrue(missingReady.isReady)
    }

    func testSummaryPrioritizesActualMissingLocatorsAndKeepsStableOrderWithinGroups() {
        let complete = fixture(id: "complete", category: "account", provider: "Provider", status: "needs_review")
        let firstMissing = fixture(id: "missing-1", category: "document", status: "ready")
        let secondComplete = fixture(id: "complete-2", category: "device", location: "Desk")
        let secondMissing = fixture(id: "missing-2", category: "subscription")
        XCTAssertEqual(MatterListPresentation.summaryMatters([complete, firstMissing, secondComplete, secondMissing]).map(\.publicId), ["missing-1", "missing-2", "complete"])
    }

    func testOwnerStatusLabelIsNeutralWithoutChangingPersistedStatus() {
        let review = fixture(status: "needs_review")
        XCTAssertEqual(MatterListPresentation.ownerStatusLabel(for: review), String(localized: "To organize"))
        XCTAssertEqual(review.status, "needs_review")
        for status in ["draft", "ready", "future_status"] {
            let matter = fixture(status: status)
            XCTAssertEqual(MatterListPresentation.ownerStatusLabel(for: matter), matter.preparationLabel)
        }
    }

    private func fixture(
        id: String = "matter", category: String = "account", title: String = "Private matter",
        provider: String? = nil, location: String? = nil, status: String = "draft", details: [String: String] = [:]
    ) -> Matter {
        Matter(publicId: id, category: category, title: title, institutionName: provider,
            accountHint: nil, valueBand: "unknown", currencyCode: nil, locationHint: location,
            importance: "important", desiredOutcome: "undecided", status: status, reviewDueAt: nil,
            version: 1, createdAt: "2026-10-06T00:00:00Z", updatedAt: "2026-10-06T00:00:00Z",
            archivedAt: nil, details: details)
    }
}
