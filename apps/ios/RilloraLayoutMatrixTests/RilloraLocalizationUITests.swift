import XCTest

/// Localized shell and authenticated UI checks against the dedicated loopback fixture.
/// Synthetic export previews stay on the simulator; no provider sign-in or real data.
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
        XCTAssertTrue(nativeTab(app, title: overview, symbol: "house").waitForExistence(timeout: 10))
        XCTAssertTrue(nativeTab(app, title: matters, symbol: "list.bullet.rectangle").exists)
        XCTAssertTrue(nativeTab(app, title: profile, symbol: "person.crop.circle").exists)
        nativeTab(app, title: matters, symbol: "list.bullet.rectangle").tap()
        XCTAssertTrue(nativeTab(app, title: matters, symbol: "list.bullet.rectangle").isSelected)
        nativeTab(app, title: profile, symbol: "person.crop.circle").tap()
        let languageButton = app.descendants(matching: .any).matching(identifier: "language.control").firstMatch
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        languageButton.tap()
        let settingsButton = app.buttons["language.open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 5))
        // Return without opening Settings or changing language, preserving normal navigation.
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        XCTAssertTrue(nativeTab(app, title: profile, symbol: "person.crop.circle").isSelected)
        XCTAssertTrue(app.buttons["public-profile.sign-in"].exists)
    }

    private var isChinese: Bool { ProcessInfo.processInfo.environment["RILLORA_UI_QA_LANGUAGE"] != "en" }
    private func copy(_ english: String, _ chinese: String) -> String { isChinese ? chinese : english }

    private func fixtureApp(landscape: Bool = false, largeText: Bool = false, systemLanguage: Bool = false) throws -> XCUIApplication {
        let base = ProcessInfo.processInfo.environment["RILLORA_MATRIX_API_BASE_URL"] ?? "http://127.0.0.1:4395/v1"
        let url = try XCTUnwrap(URLComponents(string: base))
        guard url.scheme == "http", ["127.0.0.1", "localhost", "[::1]"].contains(url.host),
              url.path == "/v1", url.user == nil, url.password == nil, url.query == nil, url.fragment == nil else {
            throw NSError(domain: "RilloraLocalizationUITests", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "Localized UI tests require a loopback fixture."])
        }
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        let app = XCUIApplication()
        if !systemLanguage {
            app.launchArguments = ["-AppleLanguages", isChinese ? "(zh-Hans)" : "(en)", "-AppleLocale", isChinese ? "zh_CN" : "en_US"]
        }
        app.launchEnvironment = ["RILLORA_API_BASE_URL": base,
                                 "RILLORA_DEV_PLANNER_ID": "11111111-1111-4111-8111-111111111111",
                                 "RILLORA_CUSTOMER_ACCESS_ENABLED": "YES"]
        if landscape { app.launchEnvironment["RILLORA_UI_TEST_LANDSCAPE"] = "1" }
        if largeText {
            app.launchEnvironment["RILLORA_UI_TEST_LARGE_TEXT"] = "1"
            app.launchEnvironment["RILLORA_UI_TEST_REDUCE_MOTION"] = "1"
        }
        app.launch()
        XCTAssertTrue(element(app, "overview.scroll").waitForExistence(timeout: 20))
        return app
    }

    func testLocalizedAuthenticatedRootsAndLandscape() throws {
        let app = try fixtureApp(landscape: true)
        XCUIDevice.shared.orientation = .landscapeLeft
        defer { XCUIDevice.shared.orientation = .portrait; app.terminate() }
        let rotated = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in app.frame.width > app.frame.height }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [rotated], timeout: 10), .completed)
        for (title, symbol, root) in [(copy("Overview", "总览"), "house", "overview.scroll"),
                                      (copy("Matters", "事项"), "list.bullet.rectangle", "matters.list"),
                                      (copy("Profile", "个人中心"), "person.crop.circle", "profile.list")] {
            let tab = nativeTab(app, title: title, symbol: symbol)
            XCTAssertTrue(tab.waitForExistence(timeout: 10)); tab.tap()
            XCTAssertTrue(element(app, root).waitForExistence(timeout: 10))
            XCTAssertTrue(tab.isSelected)
            XCTAssertGreaterThanOrEqual(tab.frame.width, 44)
            capture("localized-landscape-\(root)")
        }
    }

    /// Explicit opt-in: changes only the task's disposable simulator preference.
    /// Launch arguments must not override the system preference under test.
    func testSystemLanguagePersistsAcrossRelaunch() throws {
        try XCTSkipUnless(ProcessInfo.processInfo.environment["RILLORA_UI_QA_SYSTEM_LANGUAGE"] == "1",
                          "Run only on a dedicated, disposable language QA simulator.")
        let app = try fixtureApp(systemLanguage: true)
        defer { app.terminate() }
        let chinese = nativeTab(app, title: "事项", symbol: "list.bullet.rectangle").exists
        nativeTab(app, title: chinese ? "事项" : "Matters", symbol: "list.bullet.rectangle").tap()
        let matter = app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH %@", "matter.open.")).firstMatch
        XCTAssertTrue(matter.waitForExistence(timeout: 10))
        let savedMatterID = matter.identifier
        nativeTab(app, title: chinese ? "个人中心" : "Profile", symbol: "person.crop.circle").tap()
        element(app, "language.control").tap()
        app.buttons["language.open-settings"].tap()

        let settings = XCUIApplication(bundleIdentifier: "com.apple.Preferences")
        XCTAssertTrue(settings.wait(for: .runningForeground, timeout: 10))
        // Simulator Settings may open its root instead of the app-specific page.
        if !settings.buttons["PREFERRED_LANGUAGE"].exists && !settings.staticTexts["English"].exists {
            let apps = settings.buttons["com.apple.settings.apps"]
            for _ in 0..<6 where !apps.isHittable { settings.swipeUp() }
            XCTAssertTrue(apps.isHittable); apps.tap()
            let rillora = settings.buttons["com.rillora.ios"]
            for _ in 0..<6 where !rillora.isHittable { settings.swipeUp() }
            XCTAssertTrue(rillora.isHittable); rillora.tap()
        }
        if settings.buttons["PREFERRED_LANGUAGE"].exists { settings.buttons["PREFERRED_LANGUAGE"].tap() }
        let english = settings.staticTexts["English"].firstMatch
        XCTAssertTrue(english.waitForExistence(timeout: 5)); english.tap()
        capture("system-app-language-english-selected")

        app.terminate(); app.launch()
        XCTAssertTrue(nativeTab(app, title: "Overview", symbol: "house").waitForExistence(timeout: 15))
        nativeTab(app, title: "Matters", symbol: "list.bullet.rectangle").tap()
        XCTAssertTrue(app.buttons[savedMatterID].waitForExistence(timeout: 10))
        capture("system-language-english-data-retained")
        app.terminate(); app.launch()
        XCTAssertTrue(nativeTab(app, title: "Profile", symbol: "person.crop.circle").waitForExistence(timeout: 15))
        capture("system-language-english-second-launch")
    }

    func testLocalizedLargeTextDraftAndPrintableExport() throws {
        let app = try fixtureApp(largeText: true)
        defer { app.terminate() }
        nativeTab(app, title: copy("Matters", "事项"), symbol: "list.bullet.rectangle").tap()
        element(app, "matter.add").tap()
        let name = app.textFields["matter.edit.title"]
        reveal(name, in: app)
        name.tap(); name.typeText("QA localization unsaved draft")
        name.typeText(XCUIKeyboardKey.return.rawValue)
        app.navigationBars.buttons[copy("Cancel", "取消")].tap()
        let keep = app.buttons[copy("Keep editing", "继续编辑")].firstMatch
        XCTAssertTrue(keep.waitForExistence(timeout: 5)); keep.tap()
        XCTAssertEqual(name.value as? String, "QA localization unsaved draft")
        capture("localized-ax5-retained-draft")
        app.navigationBars.buttons[copy("Cancel", "取消")].tap()
        app.buttons[copy("Discard changes", "放弃修改")].firstMatch.tap()
        XCTAssertTrue(element(app, "matters.list").waitForExistence(timeout: 5))
        nativeTab(app, title: copy("Profile", "个人中心"), symbol: "person.crop.circle").tap()
        let start = element(app, "start-here.open")
        reveal(start, in: app); start.tap()
        let audience = element(app, "start-here.audience")
        XCTAssertTrue(audience.waitForExistence(timeout: 10))
        reveal(audience, in: app)
        if audience.buttons.firstMatch.exists { audience.buttons.firstMatch.tap() } else { audience.tap() }
        let personal = app.buttons[copy("For me", "给我自己")].firstMatch
        if personal.waitForExistence(timeout: 2) { personal.tap() }
        else { app.staticTexts[copy("For me", "给我自己")].firstMatch.tap() }
        if !element(app, "start-here.preview").exists { app.navigationBars.buttons.firstMatch.tap() }
        let preview = element(app, "start-here.preview")
        reveal(preview, in: app); XCTAssertTrue(preview.isEnabled); preview.tap()
        XCTAssertTrue(element(app, "start-here.preview-result").waitForExistence(timeout: 15))
        let format = element(app, "start-here.step.format")
        reveal(format, in: app); format.tap()
        let printable = element(app, "start-here.format.printable")
        reveal(printable, in: app); printable.tap()
        let next = element(app, "start-here.format-continue")
        reveal(next, in: app); next.tap()
        let create = element(app, "start-here.printable")
        reveal(create, in: app, allowDisabled: true)
        XCTAssertFalse(create.isEnabled)
        for id in ["start-here.ack.plaintext", "start-here.ack.copies"] {
            let ack = element(app, id)
            reveal(ack, in: app, towardStart: id == "start-here.ack.plaintext")
            XCTAssertFalse(ack.label.isEmpty, "Export acknowledgement must have a screen-reader label")
            ack.tap()
            XCTAssertEqual(ack.value as? String, "1")
        }
        reveal(create, in: app); XCTAssertTrue(create.isEnabled)
        capture("localized-ax5-export-acknowledgements")
        create.tap()
        let share = element(app, "start-here.share")
        XCTAssertTrue(share.waitForExistence(timeout: 20), "A real local API artifact must finish preparing")
        reveal(share, in: app)
        XCTAssertTrue(share.isHittable)
        XCTAssertEqual(share.label, copy("Share or print guide", "共享或打印指引"))
        capture("localized-ax5-prepared-printable")
        var auditIssues: [String] = []
        try app.performAccessibilityAudit(for: [.sufficientElementDescription, .textClipped, .hitRegion]) { issue in
            let details = XCTAttachment(string: "\(issue.detailedDescription)\n\(issue.element?.debugDescription ?? "No element")")
            details.name = "accessibility-audit-element"
            details.lifetime = .keepAlways
            self.add(details)
            auditIssues.append("\(issue.compactDescription): \(issue.element?.label ?? "No element")")
            // Collect every issue before failing, so one report does not hide the next.
            return true
        }
        XCTAssertTrue(auditIssues.isEmpty, auditIssues.joined(separator: "\n"))
    }

    private func nativeTab(_ app: XCUIApplication, title: String, symbol: String) -> XCUIElement {
        let phoneTab = app.tabBars.buttons[title]
        if phoneTab.exists { return phoneTab }
        // iPadOS 26 exposes native floating tabs as cells/other elements. Their
        // observed system-image identifier and localized label stay stable.
        return app.descendants(matching: .any).matching(identifier: symbol)
            .matching(NSPredicate(format: "label == %@", title)).firstMatch
    }

    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }

    private func reveal(_ target: XCUIElement, in app: XCUIApplication, towardStart: Bool = false, allowDisabled: Bool = false) {
        for _ in 0..<24 {
            let nav = app.navigationBars.firstMatch
            let tabs = app.tabBars.firstMatch
            let top = nav.exists ? nav.frame.maxY + 8 : app.frame.minY
            let bottom = tabs.exists && tabs.isHittable && tabs.frame.minY > top ? tabs.frame.minY - 8 : app.frame.maxY - 24
            if target.exists && (target.isHittable || (allowDisabled && !target.isEnabled))
                && target.frame.midY >= top && target.frame.midY <= bottom { return }
            let scrollToStart = target.exists && !target.frame.isEmpty
                ? target.frame.maxY < top : towardStart
            let height = max(80, bottom - top)
            let from = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: app.frame.width * 0.5, dy: top + height * (scrollToStart ? 0.2 : 0.8)))
            let to = app.coordinate(withNormalizedOffset: .zero).withOffset(CGVector(dx: app.frame.width * 0.5, dy: top + height * (scrollToStart ? 0.8 : 0.2)))
            from.press(forDuration: 0.05, thenDragTo: to)
        }
        capture("unreachable-localized-control")
        let tree = XCTAttachment(string: app.debugDescription)
        tree.name = "unreachable-localized-control-tree"
        tree.lifetime = .keepAlways
        add(tree)
        XCTFail("Localized control was unreachable after bounded scrolling")
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = "\(isChinese ? "zh-Hans" : "en")-\(name)"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
