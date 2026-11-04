import Foundation
import XCTest
@testable import Rillora

final class LocalizationTests: XCTestCase {
    func testBothNativeLanguageResourcesExist() throws {
        for language in ["en", "zh-Hans"] {
            let bundle = try resourceBundle(language)
            XCTAssertNotEqual(bundle.localizedString(forKey: "Matters", value: "MISSING", table: "Localizable"), "MISSING")
        }
    }

    func testChineseCoreTerminology() throws {
        let bundle = try resourceBundle("zh-Hans")
        for (key, value) in ["Overview": "总览", "Matters": "事项", "Profile": "个人中心", "Name": "名称", "Directions": "查找指引", "Details": "详细资料", "Language": "语言"] {
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), value)
        }
    }

    func testEnglishFallbackStaysReadable() throws {
        let bundle = try resourceBundle("en")
        XCTAssertEqual(bundle.localizedString(forKey: "Language", value: nil, table: "Localizable"), "Language")
        XCTAssertEqual(bundle.localizedString(forKey: "Contact name", value: nil, table: "Localizable"), "Name")
        let chinese = try resourceBundle("zh-Hans")
        XCTAssertEqual(chinese.localizedString(forKey: "Contact name", value: nil, table: "Localizable"), "姓名")
        XCTAssertEqual(chinese.localizedString(forKey: "Name", value: nil, table: "Localizable"), "名称")
        XCTAssertEqual(L10n.format("Future readable key", arguments: [], bundle: bundle, locale: Locale(identifier: "en_US")), "Future readable key")
    }

    func testChineseKnownErrorUsesCodeNotServerText() throws {
        let bundle = try resourceBundle("zh-Hans")
        let message = L10n.serverError(status: 403, code: "reauthentication_required", message: "PRIVATE SERVER TEXT", bundle: bundle)
        XCTAssertEqual(message, "请重新登录，确认是你本人在操作。")
    }

    func testUnknownChineseErrorDoesNotExposeOrTranslateServerContent() throws {
        let bundle = try resourceBundle("zh-Hans")
        let message = L10n.serverError(status: 500, code: "future_error", message: "Name", bundle: bundle)
        XCTAssertEqual(message, "暂时无法完成此操作，请重试。")
    }

    func testChinesePurchaseConflictsRemainActionableWithoutEchoingServerText() throws {
        let bundle = try resourceBundle("zh-Hans")
        let messages = [
            "purchase_terms_changed": "价格或订阅条款已变化。请刷新报价；如有待处理购买，请先核对。",
            "purchase_account_changed": "当前账号已变化。请返回套餐页重新核对后再订阅。",
            "apple_purchase_in_progress": "有一笔 Apple 购买尚未确认完成。请先检查待处理购买。",
            "apple_purchase_owner_conflict": "这笔 Apple 购买关联的是另一个 Rillora 账号。请登录当时购买时使用的 Rillora 账号。",
            "checkout_finished": "这笔购买已处理完毕。请刷新套餐与权限。",
        ]
        for (code, expected) in messages {
            XCTAssertEqual(L10n.serverError(status: 409, code: code,
                message: "PRIVATE SERVER TEXT", bundle: bundle), expected, code)
        }
    }

    func testEnglishServerMessageContractIsPreserved() throws {
        let bundle = try resourceBundle("en")
        XCTAssertEqual(L10n.serverError(status: 401, code: "authentication_required", message: "Authentication is required.", bundle: bundle), "Authentication is required.")
    }

    func testEnglishPurchaseConflictDoesNotSendTheUserToReadALegalPage() throws {
        let bundle = try resourceBundle("en")
        XCTAssertEqual(L10n.serverError(status: 409, code: "purchase_terms_changed",
            message: "Review the current subscription terms.", bundle: bundle),
            "The price or subscription terms changed. Refresh the price and check any pending purchase.")
    }

    func testReviewAccessRejectionDoesNotExposeInternalTestingCopy() throws {
        let error = RilloraAPIError.server(status: 403, code: "apple_review_not_enrolled",
            message: "This account is not enrolled for Apple purchase testing.", requestID: nil)
        XCTAssertFalse(error.isAuthenticationRequired)
        XCTAssertFalse(error.isReauthenticationRequired)
        XCTAssertEqual(L10n.serverError(status: 403, code: "apple_review_not_enrolled",
            message: "This account is not enrolled for Apple purchase testing.", bundle: try resourceBundle("en")),
            "Apple purchases are not available for this account. Contact support for help.")
        XCTAssertEqual(L10n.serverError(status: 403, code: "apple_review_not_enrolled",
            message: "PRIVATE SERVER TEXT", bundle: try resourceBundle("zh-Hans")),
            "当前账号无法使用 Apple 购买。请联系支持获取帮助。")
    }

    func testFormattedPrivateValueIsNotAKeyOrFormatString() throws {
        let bundle = try resourceBundle("zh-Hans")
        let title = "Name %@ %lld 100% 私人内容"
        XCTAssertEqual(L10n.format("%1$@ · Required", arguments: [title], bundle: bundle, locale: Locale(identifier: "zh_CN")), title + " · 必填")
    }

    private func resourceBundle(_ language: String) throws -> Bundle {
        let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
        return try XCTUnwrap(Bundle(path: path))
    }
}
