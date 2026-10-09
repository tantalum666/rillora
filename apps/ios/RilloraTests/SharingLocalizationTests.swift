import Foundation
import XCTest
@testable import Rillora

final class SharingLocalizationTests: XCTestCase {
    func testSimplifiedChineseSharingTermsAndSafetyMessages() throws {
        let bundle = try localizedBundle("zh-Hans")
        for (key, expected) in [
            "Name": "名称",
            "Directions": "查找指引",
            "Details": "详细资料",
            "Revoke trusted-contact role": "撤销可信联系人角色",
            "The encrypted package failed its local offline-recovery test.": "加密包未通过本地离线恢复测试。",

        ] {
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), expected)
        }
    }

    func testReviewRequestAndExportCountsUsePluralResources() throws {
        let english = try localizedBundle("en")
        let chinese = try localizedBundle("zh-Hans")
        let requestKey = "Request %1$lld checks"
        XCTAssertEqual(L10n.format(requestKey, arguments: [Int64(1)], bundle: english, locale: Locale(identifier: "en_US")), "Request 1 check")
        XCTAssertEqual(L10n.format(requestKey, arguments: [Int64(2)], bundle: english, locale: Locale(identifier: "en_US")), "Request 2 checks")
        XCTAssertEqual(L10n.format(requestKey, arguments: [Int64(2)], bundle: chinese, locale: Locale(identifier: "zh_CN")), "请求复核 2 个事项")
        let exportKey = "%1$lld matters in this copy"
        XCTAssertEqual(L10n.format(exportKey, arguments: [Int64(1)], bundle: english, locale: Locale(identifier: "en_US")), "1 matter in this copy")
        XCTAssertEqual(L10n.format(exportKey, arguments: [Int64(0)], bundle: chinese, locale: Locale(identifier: "zh_CN")), "此副本包含 0 个事项")
    }

    func testLocalizationDoesNotChangeSharingWireValuesOrScope() throws {
        XCTAssertEqual(SharingDetailLevel.allCases.map(\.rawValue), ["name", "directions", "details"])
        XCTAssertEqual(SharingDetailLevel.name.allowedFields, Set(["title", "category"]))
        XCTAssertEqual(SharingDetailLevel.directions.allowedFields, Set(["title", "category", "institutionName", "locationHint", "desiredOutcome"]))
        XCTAssertFalse(SharingDetailLevel.details.allowedFields.contains("password"))
        XCTAssertEqual(String(decoding: try JSONEncoder().encode(SharingConnectionStatus.accepted), as: UTF8.self), "\"accepted\"")
    }

    func testPrivateTitleIsPreservedWithoutBeingUsedAsAFormatKey() {
        let title = "私密 100% %@ Name"
        let item = SharedMatterItem(connectionPublicId: "11111111-1111-4111-8111-111111111111",
                                    ownerName: "Owner", matterPublicId: "22222222-2222-4222-8222-222222222222",
                                    detailLevel: .name, fields: ["title": title, "category": "account"])
        XCTAssertEqual(item.title, title)
        XCTAssertTrue(L10n.format("%1$@ · Private", title).hasPrefix(title))
    }

    private func localizedBundle(_ language: String) throws -> Bundle {
        let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
        return try XCTUnwrap(Bundle(path: path))
    }
}
