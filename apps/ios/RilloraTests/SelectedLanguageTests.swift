import XCTest
@testable import Rillora

final class SelectedLanguageTests: XCTestCase {
    func testSharedDisclosureResourceCoversBothLanguagesAndDoesNotEchoUnknownText() {
        XCTAssertEqual(DisclosurePresentation.state("death_identity_review", chinese: true), "身份核验")
        XCTAssertEqual(DisclosurePresentation.state("missing_appealed", chinese: true), "申诉处理中")
        XCTAssertEqual(DisclosurePresentation.stage("locator", chinese: false), "Locator")
        XCTAssertEqual(DisclosurePresentation.reason("private user content", chinese: true), "暂无补充说明。")
    }

    func testHostedAuthenticationUsesAppLanguageWithoutChangingIdentityIntent() {
        let chinese = Auth0NativeAuthenticationService.authorizationParameters(for: .signIn, localeIdentifier: "zh-Hans")
        let english = Auth0NativeAuthenticationService.authorizationParameters(for: .signIn, localeIdentifier: "en")
        XCTAssertEqual(chinese["ui_locales"], "zh-CN")
        XCTAssertEqual(english["ui_locales"], "en")
        XCTAssertEqual(chinese["prompt"], english["prompt"])
        XCTAssertEqual(chinese["rillora_auth_ui"], english["rillora_auth_ui"])
    }
}
