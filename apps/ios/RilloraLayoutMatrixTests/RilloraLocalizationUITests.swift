import XCTest

/// Signed-out language smoke tests. Uses existing Debug-only fixture isolation;
/// never signs in, changes OS preferences, creates records, or opens external apps.
@MainActor
final class RilloraLocalizationUITests: XCTestCase {
    func testSimplifiedChineseNativeShellAndLanguageReturn() {
        assertShell(language: "zh-Hans", locale: "zh_CN", overview: "总览", matters: "事项", profile: "个人中心")
    }

    func testEnglishNativeShellAndLanguageReturn() {
        assertShell(language: "en", locale: "en_US", overview: "Overview", matters: "Matters", profile: "Profile")
    }

    private func assertShell(language: String, locale: String, overview: String, matters: String, profile: String) {
        let app = XCUIApplication()
        app.launchArguments += ["-AppleLanguages", "(\(language))", "-AppleLocale", locale]
        app.launchEnvironment["RILLORA_UI_TEST_FORCE_SIGNED_OUT"] = "1"
        app.launch()
        XCTAssertTrue(app.tabBars.buttons[overview].waitForExistence(timeout: 10))
        XCTAssertTrue(app.tabBars.buttons[matters].exists)
        XCTAssertTrue(app.tabBars.buttons[profile].exists)
        app.tabBars.buttons[matters].tap()
        XCTAssertTrue(app.tabBars.buttons[matters].isSelected)
        app.tabBars.buttons[profile].tap()
        let languageButton = app.descendants(matching: .any).matching(identifier: "language.control").firstMatch
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        languageButton.tap()
        let settingsButton = app.buttons["language.open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 5))
        // Return without opening Settings or changing language, preserving normal navigation.
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        XCTAssertTrue(app.tabBars.buttons[profile].isSelected)
        XCTAssertTrue(app.buttons["public-profile.sign-in"].exists)
    }
}
