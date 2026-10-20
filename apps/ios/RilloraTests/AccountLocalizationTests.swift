import Foundation
import XCTest
@testable import Rillora

final class AccountLocalizationTests: XCTestCase {
    func testSimplifiedChineseAccountAndPurchaseResources() throws {
        let bundle = try localizedBundle("zh-Hans")
        for (key, expected) in [
            "Plan & access": "套餐与权限",
            "Type DELETE to confirm": "输入“删除”以确认",
            "Restore purchases": "恢复购买",
            "The secure session store is unavailable.": "暂时无法安全保存登录状态，请重试。",
            "DELETE": "删除",
        ] {
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), expected)
        }
    }

    func testEnglishAccountResourcesRemainAvailable() throws {
        let bundle = try localizedBundle("en")
        for key in ["My data", "Restore purchases", "Type DELETE to confirm"] {
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), key)
        }
    }

    func testImportedMatterPluralUsesTheSelectedResourceBundle() throws {
        let key = "%1$lld matters imported. Sharing stays off."
        let english = try localizedBundle("en")
        let chinese = try localizedBundle("zh-Hans")
        XCTAssertEqual(L10n.format(key, arguments: [Int64(1)], bundle: english, locale: Locale(identifier: "en_US")),
                       "1 matter imported. Sharing stays off.")
        XCTAssertEqual(L10n.format(key, arguments: [Int64(2)], bundle: english, locale: Locale(identifier: "en_US")),
                       "2 matters imported. Sharing stays off.")
        XCTAssertEqual(L10n.format(key, arguments: [Int64(2)], bundle: chinese, locale: Locale(identifier: "zh_CN")),
                       "已导入 2 个事项。共享仍处于关闭状态。")
    }

    func testFormattingPreservesPrivateTitleAndPercentSigns() {
        let title = "私人的 100% record %@ · DELETE"
        let displayed = L10n.format("%1$@ · Archived", title)
        XCTAssertTrue(displayed.hasPrefix(title))
        XCTAssertEqual(displayed.components(separatedBy: title).count, 2)
    }

    func testProviderPriceAndCurrencyRemainUnmodified() {
        let product = StoreKitProductSnapshot(
            productID: RilloraStoreKitCatalog.familyAnnualProductID,
            displayName: "Provider-supplied title",
            description: "Provider-supplied description",
            displayPrice: "HK$888.00",
            subscriptionGroupID: RilloraStoreKitCatalog.appStoreFamilySubscriptionGroupID,
            priceMilliunits: 888_000,
            currencyCode: "HKD",
            oneYearSubscription: true
        )
        XCTAssertEqual(product.displayPrice, "HK$888.00")
        XCTAssertEqual(product.currencyCode, "HKD")
        XCTAssertEqual(product.priceMilliunits, 888_000)
        XCTAssertEqual(product.displayName, "Provider-supplied title")
    }

    private func localizedBundle(_ language: String) throws -> Bundle {
        let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
        return try XCTUnwrap(Bundle(path: path))
    }
}
