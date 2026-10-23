import XCTest

@MainActor
final class HealthCheckInUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testEnglishHealthAndCheckIn() { exercise(language: "en") }
    func testChineseHealthAndCheckIn() { exercise(language: "zh-Hans") }
    func testDeniedNotificationsOfferSettingsAndKeepManualConfirmation() {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(en)", "-AppleLocale", "en_US"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": "http://127.0.0.1:4397/v1",
            "RILLORA_DEV_PLANNER_ID": "11111111-1111-4111-8111-111111111111", "RILLORA_CUSTOMER_ACCESS_ENABLED": "true",
            "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1", "RILLORA_HEALTH_UI_FIXTURE": "1", "RILLORA_CHECKIN_DENIED_QA": "1"]
        app.launch(); defer { app.terminate() }
        let profile = app.tabBars.buttons["Profile"]; XCTAssertTrue(profile.waitForExistence(timeout: 20)); profile.tap()
        let entry = item(app, "checkin.open"); reveal(entry, app: app); entry.tap()
        let enable = item(app, "checkin.enable"); XCTAssertTrue(enable.waitForExistence(timeout: 5)); reveal(enable, app: app); enable.tap()
        let settings = item(app, "checkin.settings"); reveal(settings, app: app)
        XCTAssertFalse(item(app, "checkin.pause").exists)
        let confirm = item(app, "checkin.confirm"); reveal(confirm, app: app, up: false); confirm.tap()
        XCTAssertTrue(item(app, "checkin.confirmed").waitForExistence(timeout: 5))
        capture(app, "checkin-notification-denied-manual-confirmation")
    }
    private func exercise(language: String) {
        let app = XCUIApplication(), zh = language != "en"
        XCUIDevice.shared.orientation = .portrait
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", zh ? "zh_CN" : "en_US"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": "http://127.0.0.1:4397/v1",
            "RILLORA_DEV_PLANNER_ID": "11111111-1111-4111-8111-111111111111",
            "RILLORA_CUSTOMER_ACCESS_ENABLED": "true", "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1",
            "RILLORA_HEALTH_UI_FIXTURE": "1", "RILLORA_CHECKIN_NOTIFICATION_QA": "1"]
        addUIInterruptionMonitor(withDescription: "Synthetic simulator notification authorization") { alert in
            for title in ["Allow", "允许"] where alert.buttons[title].exists { alert.buttons[title].tap(); return true }
            return false
        }
        app.launch(); defer { app.terminate() }
        let profile = app.tabBars.buttons[zh ? "个人中心" : "Profile"]
        XCTAssertTrue(profile.waitForExistence(timeout: 20)); profile.tap()
        let health = item(app, "health-review.open"); reveal(health, app: app); health.tap()
        XCTAssertTrue(item(app, "health-review.view").waitForExistence(timeout: 5))
        for metric in ["sleep", "workouts"] {
            let toggle = app.switches["health-review.type." + metric]
            reveal(toggle, app: app)
            let control = toggle.switches.firstMatch
            if control.exists { control.tap() } else { toggle.tap() }
            XCTAssertEqual(toggle.value as? String, "1")
        }
        let read = item(app, "health-review.read"); reveal(read, app: app, up: false); read.tap()
        let heart = item(app, "health-review.value.heartRate")
        XCTAssertTrue(heart.waitForExistence(timeout: 5))
        capture(app, "health-records-" + language)
        for metric in ["steps", "walkingDistance", "sleep", "workouts"] { reveal(item(app, "health-review.value." + metric), app: app) }
        let clear = item(app, "health-review.clear"); reveal(clear, app: app); clear.tap()
        XCTAssertFalse(item(app, "health-review.value.heartRate").exists)
        app.navigationBars.buttons.firstMatch.tap()
        let checkIn = item(app, "checkin.open"); reveal(checkIn, app: app); checkIn.tap()
        let confirm = item(app, "checkin.confirm"); XCTAssertTrue(confirm.waitForExistence(timeout: 5)); confirm.tap()
        XCTAssertTrue(item(app, "checkin.confirmed").waitForExistence(timeout: 5))
        let enable = item(app, "checkin.enable"); reveal(enable, app: app); enable.tap()
        let systemAlert = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
        if systemAlert.waitForExistence(timeout: 2) {
            let allow = systemAlert.buttons["Allow"].exists ? systemAlert.buttons["Allow"] : systemAlert.buttons["允许"]
            XCTAssertTrue(allow.exists); allow.tap()
        }
        let pause = item(app, "checkin.pause"); XCTAssertTrue(pause.waitForExistence(timeout: 5))
        reveal(pause, app: app); pause.tap()
        XCTAssertTrue(item(app, "checkin.paused").waitForExistence(timeout: 5))
        capture(app, "checkin-confirmed-paused-" + language)
    }
    private func item(_ app: XCUIApplication, _ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    private func reveal(_ value: XCUIElement, app: XCUIApplication, up: Bool = true) {
        for _ in 0..<12 { if value.exists && value.isHittable { return }; if up { app.swipeUp() } else { app.swipeDown() } }
        let tree = XCTAttachment(string: app.debugDescription); tree.lifetime = .keepAlways; add(tree)
        capture(app, "unreachable-control"); XCTAssertTrue(value.exists && value.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot()); attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
