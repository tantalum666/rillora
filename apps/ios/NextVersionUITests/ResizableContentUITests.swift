import XCTest

@MainActor
final class ResizableContentUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testEnglishDraftAcrossRotation() { exercise(language: "en") }
    func testChineseDraftAcrossRotation() { exercise(language: "zh-Hans") }

    private func exercise(language: String) {
        let zh = language != "en", app = XCUIApplication()
        XCUIDevice.shared.orientation = .portrait
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", zh ? "zh_CN" : "en_US"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": "http://127.0.0.1:4397/v1",
            "RILLORA_DEV_PLANNER_ID": "11111111-1111-4111-8111-111111111111",
            "RILLORA_CUSTOMER_ACCESS_ENABLED": "true", "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1"]
        app.launch()
        defer { XCUIDevice.shared.orientation = .portrait; app.terminate() }
        let profile = app.tabBars.buttons[zh ? "个人中心" : "Profile"]
        XCTAssertTrue(profile.waitForExistence(timeout: 20))
        profile.tap()
        let entry = element(app, "content.open")
        reveal(entry, app: app); entry.tap()
        XCTAssertTrue(element(app, "content.workspace").waitForExistence(timeout: 12))
        let notice = element(app, "content.review-notice")
        if notice.waitForExistence(timeout: 1) {
            notice.tap()
            let accept = element(app, "content.acknowledge")
            reveal(accept, app: app); accept.tap()
        }
        let create = element(app, "content.new-pack")
        XCTAssertTrue(create.waitForExistence(timeout: 10)); create.tap()
        let title = app.textFields["content.packTitle"]
        XCTAssertTrue(title.waitForExistence(timeout: 5))
        let value = zh ? "窗口变化后保留的合成办理包" : "Synthetic draft retained across window changes"
        title.tap(); title.typeText(value)

        XCUIDevice.shared.orientation = .landscapeLeft
        let wide = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width > app.frame.height }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [wide], timeout: 8), .completed, "An orientation command alone is not a resize result")
        XCTAssertEqual(title.value as? String, value)
        capture(app, "content-keyboard-landscape-" + language)
        title.typeText("\n")
        let keyboardDismissed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.keyboards.firstMatch)
        XCTAssertEqual(XCTWaiter.wait(for: [keyboardDismissed], timeout: 5), .completed)
        let save = element(app, "content.save-pack")
        reveal(save, app: app)
        XCTAssertTrue(save.isEnabled && save.isHittable)
        capture(app, "content-draft-landscape-" + language)

        XCUIDevice.shared.orientation = .portrait
        let narrow = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width < app.frame.height }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [narrow], timeout: 8), .completed)
        for _ in 0..<8 { if title.isHittable { break }; app.swipeDown() }
        XCTAssertEqual(title.value as? String, value)
        capture(app, "content-draft-portrait-" + language)
        app.buttons[zh ? "关闭" : "Close"].firstMatch.tap()
        XCTAssertTrue(app.buttons[zh ? "放弃未保存的修改" : "Discard unsaved changes"].waitForExistence(timeout: 3))
        // Do not save or publish this deliberately unsaved synthetic draft.
    }

    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    private func reveal(_ item: XCUIElement, app: XCUIApplication) {
        for _ in 0..<10 {
            if item.exists && item.isHittable { return }
            if !app.keyboards.firstMatch.exists { app.swipeUp(); continue }
            // A center-screen swipe hits the keyboard in a short landscape window.
            // Drag the visible form area, like a user scrolling above the keyboard.
            let region = app.collectionViews.allElementsBoundByIndex.last(where: { $0.isHittable }) ?? app
            let frame = region.frame.intersection(app.frame)
            let navigationBottom = app.navigationBars.allElementsBoundByIndex.last?.frame.maxY ?? frame.minY
            let top = max(frame.minY, navigationBottom) + 12
            let bottom = min(frame.maxY, app.keyboards.firstMatch.exists ? app.keyboards.firstMatch.frame.minY : frame.maxY) - 12
            XCTAssertGreaterThan(bottom, top)
            let origin = app.coordinate(withNormalizedOffset: .zero)
            origin.withOffset(CGVector(dx: frame.midX, dy: bottom))
                .press(forDuration: 0.1, thenDragTo: origin.withOffset(CGVector(dx: frame.midX, dy: top)))
        }
        capture(app, "unreachable-" + item.identifier)
        let tree = XCTAttachment(string: app.debugDescription); tree.lifetime = .keepAlways; add(tree)
        XCTAssertTrue(item.exists && item.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
