import XCTest

/// Actual hit testing of the shipping Form and purchase card in a local-only host.
/// No credentials, network purchase, consent submission or StoreKit sheet is used.
@MainActor
final class ApplePurchaseInteractionTests: XCTestCase {
    func testEnabledSubscribeStartsPurchaseWithoutOpeningAPolicy() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_HK"]
        app.launchEnvironment = ["RILLORA_PREVIEW_PLAN_STATE": "ready",
                                 "RILLORA_PREVIEW_CURRENCY": "HKD",
                                 "RILLORA_PREVIEW_CAPTURE_LINKS": "1"]
        app.launch()
        defer { app.terminate() }
        let entry = app.buttons["preview.apple-purchase"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        let button = app.buttons["apple-purchase.subscribe"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        XCTAssertTrue(button.isEnabled)
        button.tap()
        // The local-only service refuses at preparation. Reaching the status
        // proves the purchase action ran; no Apple purchase is issued.
        XCTAssertTrue(app.staticTexts["apple-purchase.status"].waitForExistence(timeout: 5))
        XCTAssertEqual(app.staticTexts["preview.opened-policy"].label, "none")
    }

    func testDisabledPurchaseAreaDoesNotOpenTermsEnglish() {
        verifyDisabledPurchase(language: "en", locale: "en_HK")
    }

    func testDisabledPurchaseAreaDoesNotOpenTermsChinese() {
        verifyDisabledPurchase(language: "zh-Hans", locale: "zh_HK")
    }

    private func verifyDisabledPurchase(language: String, locale: String) {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", locale]
        app.launchEnvironment = ["RILLORA_PREVIEW_PLAN_STATE": "unavailable",
                                 "RILLORA_PREVIEW_CURRENCY": "HKD",
                                 "RILLORA_PREVIEW_CAPTURE_LINKS": "1"]
        app.launch()
        defer { app.terminate() }
        let entry = app.buttons["preview.apple-purchase"]
        XCTAssertTrue(entry.waitForExistence(timeout: 10))
        entry.tap()
        let button = app.buttons["apple-purchase.subscribe"]
        XCTAssertTrue(button.waitForExistence(timeout: 10))
        XCTAssertFalse(button.isEnabled)
        let linkResult = app.staticTexts["preview.opened-policy"]
        XCTAssertEqual(linkResult.label, "none")

        // A finger can land on a disabled control. The row must not turn this
        // into the Terms action, nor treat the surrounding price as a link.
        button.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertEqual(linkResult.label, "none", "Disabled Subscribe incorrectly opens a policy")
        app.staticTexts["apple-purchase.price"].tap()
        XCTAssertEqual(linkResult.label, "none", "The whole plan card must not act as a policy link")

        let termsLink = app.descendants(matching: .any)
            .matching(identifier: "apple-purchase.terms").firstMatch
        XCTAssertTrue(termsLink.exists)
        XCTAssertEqual(termsLink.label, language == "en" ? "Terms" : "服务条款")
        termsLink.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
        XCTAssertEqual(linkResult.label, "/subscription-terms", "The explicit Terms link must still work")
    }
}
