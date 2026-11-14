import XCTest

@MainActor
final class WatchCheckInUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testEnglishLinkedActions() { exercise(language: "en", offline: false) }
    func testChineseLinkedActions() { exercise(language: "zh-Hans", offline: false) }
    func testEnglishOfflineStaysPending() { exercise(language: "en", offline: true) }
    func testChineseOfflineStaysPending() { exercise(language: "zh-Hans", offline: true) }
    private func exercise(language: String, offline: Bool) {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", language == "en" ? "en_US" : "zh_CN"]
        app.launchEnvironment = ["RILLORA_WATCH_UI_FIXTURE": offline ? "offline" : "linked"]
        app.launch(); defer { app.terminate() }
        let confirm = app.buttons["watch.checkin.confirm"]
        XCTAssertTrue(confirm.waitForExistence(timeout: 15))
        let ready = XCTNSPredicateExpectation(predicate: NSPredicate(format: "isHittable == true AND isEnabled == true"), object: confirm)
        XCTAssertEqual(XCTWaiter.wait(for: [ready], timeout: 5), .completed)
        confirm.tap()
        if offline {
            XCTAssertTrue(app.descendants(matching: .any)["watch.checkin.pending"].waitForExistence(timeout: 5))
            XCTAssertFalse(app.descendants(matching: .any)["watch.checkin.synced"].exists)
            XCTAssertFalse(confirm.isEnabled)
        } else {
            XCTAssertTrue(app.descendants(matching: .any)["watch.checkin.synced"].waitForExistence(timeout: 5))
            let pause = app.buttons["watch.checkin.pause"]; reveal(pause, app: app); pause.tap()
            let resume = app.buttons["watch.checkin.resume"]; XCTAssertTrue(resume.waitForExistence(timeout: 5)); reveal(resume, app: app); resume.tap()
            XCTAssertTrue(pause.waitForExistence(timeout: 5))
        }
        let picture = XCTAttachment(screenshot: app.screenshot())
        picture.name = "watch-\(language)-\(offline ? "pending" : "confirmed")"; picture.lifetime = .keepAlways; add(picture)
    }
    private func reveal(_ element: XCUIElement, app: XCUIApplication) {
        for _ in 0..<8 { if element.exists && element.isHittable { return }; app.scrollViews.firstMatch.swipeUp() }
        XCTAssertTrue(element.exists && element.isHittable)
    }
}
