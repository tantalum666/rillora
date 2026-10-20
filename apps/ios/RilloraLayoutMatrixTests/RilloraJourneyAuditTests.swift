import XCTest

/// Explicit local audit only; never uses an existing cloud identity or private map.
@MainActor
final class RilloraJourneyAuditTests: XCTestCase {
    private var app: XCUIApplication!

    private func launchAudit(largeText: Bool = false) throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["RILLORA_RUN_LOCAL_AUDIT"] == "1", "Requires the explicitly isolated 4280 audit fixture")
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["RILLORA_API_BASE_URL"] = "http://127.0.0.1:4280/v1"
        app.launchEnvironment["RILLORA_DEV_PLANNER_ID"] = "11111111-1111-4111-8111-111111111111"
        if largeText {
            app.launchEnvironment["RILLORA_UI_TEST_LARGE_TEXT"] = "1"
            app.launchEnvironment["RILLORA_UI_TEST_REDUCE_MOTION"] = "1"
        }
        app.launch()
        XCTAssertTrue(item("overview.scroll").waitForExistence(timeout: 20))
    }
    private func item(_ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    private func tab(_ name: String) {
        app.tabBars.buttons[name].tap()
    }
    private func reveal(_ target: XCUIElement) {
        for _ in 0..<14 {
            let bottom = app.tabBars.firstMatch.exists ? app.tabBars.firstMatch.frame.minY : app.frame.maxY
            if target.exists && target.isHittable && target.frame.midY < bottom - 12 && target.frame.minY > 90 { return }
            let up = !target.exists || target.frame.minY > app.frame.midY
            let start = app.coordinate(withNormalizedOffset: .init(dx: 0.5, dy: up ? 0.72 : 0.4))
            let end = app.coordinate(withNormalizedOffset: .init(dx: 0.5, dy: up ? 0.4 : 0.72))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        XCTAssertTrue(target.isHittable)
    }
    private func open(_ id: String, root: String) {
        let target = item(id); reveal(target); target.tap()
        XCTAssertTrue(item(root).waitForExistence(timeout: 12))
    }
    private func capture(_ name: String) {
        let image = XCTAttachment(screenshot: app.screenshot())
        image.name = name; image.lifetime = .keepAlways; add(image)
    }
    private func backToProfile() {
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(item("profile.list").waitForExistence(timeout: 5))
    }

    func testLocalAuditProfileAndToolRoutes() throws {
        try launchAudit()
        capture("15-native-authenticated-map")
        tab("Profile")
        XCTAssertTrue(item("profile.list").waitForExistence(timeout: 10))
        capture("16-native-profile-people")
        open("plan-access.open", root: "plan-access.view")
        capture("17-native-plan-access"); backToProfile()
        open("maintenance.open", root: "maintenance.view")
        capture("18-native-shared-reviews"); backToProfile()
        open("account-data.open", root: "account-data.view")
        capture("19-native-my-data")
        open("account-data.open-copy", root: "saved-copy.view")
        capture("20-native-saved-copy-reader")
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(item("account-data.view").waitForExistence(timeout: 5))
        backToProfile()
        open("start-here.open", root: "start-here.view")
        capture("21-native-export-scope"); backToProfile()
        open("profile.safety", root: "profile.safety.view")
        capture("22-native-safety")
        open("profile.safety.design-credits", root: "profile.design-credits")
        capture("23-native-licenses")
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(item("profile.safety.view").waitForExistence(timeout: 5))
        backToProfile()
        open("profile.about", root: "profile.about.view")
        capture("24-native-about")
    }

    func testLocalAuditMatterAndGuideRoutes() throws {
        try launchAudit(); tab("Matters")
        XCTAssertTrue(item("matters.list").waitForExistence(timeout: 10))
        capture("25-native-matters")
        let crypto = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "On-chain wallet for friend only")).firstMatch
        reveal(crypto); crypto.tap()
        XCTAssertTrue(item("matter.editor").waitForExistence(timeout: 10))
        capture("26-native-crypto-details")
        app.navigationBars.buttons.firstMatch.tap()
        tab("Profile")
        open("official-setup.open", root: "official-setup.view")
        capture("27-native-guides")
        open("official-guide.apple", root: "official-guide-detail.apple")
        capture("28-native-apple-guidance")
        app.navigationBars.buttons.firstMatch.tap()
        let coinbase = item("official-guide.coinbase"); reveal(coinbase)
        capture("29-native-guide-marks")
        coinbase.tap()
        XCTAssertTrue(item("official-guide-detail.coinbase").waitForExistence(timeout: 5))
        capture("30-native-coinbase-guidance")
    }

    func testLocalAuditLargeTextAndReducedMotion() throws {
        try launchAudit(largeText: true)
        capture("56-native-large-overview")
        tab("Matters")
        XCTAssertTrue(item("matters.list").waitForExistence(timeout: 10))
        capture("57-native-large-matters")
        item("matter.add").tap()
        XCTAssertTrue(item("matter.editor").waitForExistence(timeout: 10))
        capture("58-native-large-editor")
        for text in app.staticTexts.allElementsBoundByIndex where text.frame.intersects(app.frame) {
            XCTAssertGreaterThanOrEqual(text.frame.minX, app.frame.minX - 1, text.label)
            XCTAssertLessThanOrEqual(text.frame.maxX, app.frame.maxX + 1, text.label)
        }
        app.navigationBars.buttons["Cancel"].tap()
        tab("Profile")
        capture("59-native-large-profile")
        open("start-here.open", root: "start-here.view")
        capture("60-native-large-export")
    }
}
