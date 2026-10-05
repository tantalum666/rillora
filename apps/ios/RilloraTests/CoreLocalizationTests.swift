import Foundation
import XCTest
@testable import Rillora

final class CoreLocalizationTests: XCTestCase {
    func testChineseCoreTerminologyAndGuideBoundary() throws {
        let bundle = try localizedBundle("zh-Hans")
        for (key, expected) in [
            "Matters": "事项",
            "Name": "名称",
            "Details": "已保存的详细信息",
            "Trusted contact": "可信联系人",
            "Online account": "网络账户",
            "Guide content is in English.": "指南正文为英文。",
        ] {
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), expected)
        }
    }

    func testMatterCountGrammarUsesTheSelectedLanguage() throws {
        let english = try localizedBundle("en")
        let chinese = try localizedBundle("zh-Hans")
        for count in [0, 1, 2] {
            XCTAssertEqual(
                L10n.format("%1$lld matters", arguments: [Int64(count)], bundle: english, locale: Locale(identifier: "en_US")),
                count == 1 ? "1 matter" : "\(count) matters"
            )
            XCTAssertEqual(
                L10n.format("%1$lld matters", arguments: [Int64(count)], bundle: chinese, locale: Locale(identifier: "zh_CN")),
                "\(count) 个事项"
            )
        }
        XCTAssertEqual(
            L10n.format("%1$lld essentials left", arguments: [Int64(1)], bundle: english, locale: Locale(identifier: "en_US")),
            "1 essential left"
        )
        XCTAssertEqual(
            L10n.format("%1$lld matters shared. Everything else stays private.", arguments: [Int64(1)], bundle: english, locale: Locale(identifier: "en_US")),
            "1 matter shared. Everything else stays private."
        )
    }

    func testFormattingPreservesSuppliedNamesAndFormatCharacters() throws {
        let name = "Draft 100% %@ 私人记录"
        let bundle = try localizedBundle("zh-Hans")
        XCTAssertEqual(
            L10n.format("Shared with %1$@", arguments: [name], bundle: bundle, locale: Locale(identifier: "zh_CN")),
            "与\(name)共享"
        )
    }

    func testMatterRequestsPreserveSavedTextAndStableMachineValues() throws {
        var draft = MatterDraft()
        draft.title = "Draft"
        draft.institutionName = "Name"
        draft.locationHint = "Details 100% %@ 私人位置"
        draft.accountHint = "Ref-末尾 42"
        draft.notes = "Save"
        let request = try XCTUnwrap(draft.createRequest())
        XCTAssertEqual(request.title, "Draft")
        XCTAssertEqual(request.institutionName, "Name")
        XCTAssertEqual(request.locationHint, "Details 100% %@ 私人位置")
        XCTAssertEqual(request.accountHint, "Ref-末尾 42")
        XCTAssertEqual(request.notes, "Save")
        XCTAssertEqual(request.category, "account")
        XCTAssertEqual(request.status, "draft")
        XCTAssertEqual(request.importance, "important")
        XCTAssertEqual(request.desiredOutcome, "undecided")
    }

    func testGuideGroupTranslationDoesNotMutateItsSourceTitle() {
        let source = OfficialProviderGuideGroup(id: "cloud", title: "Cloud & email")
        XCTAssertEqual(source.title, "Cloud & email")
        XCTAssertFalse(source.localizedTitle.isEmpty)
        let future = OfficialProviderGuideGroup(id: "future_group", title: "Future source title")
        XCTAssertEqual(future.localizedTitle, "Future source title")
    }

    private func localizedBundle(_ language: String) throws -> Bundle {
        let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
        return try XCTUnwrap(Bundle(path: path))
    }
}
