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
        let preferences = element(app, "public-profile.preferences")
        reveal(preferences, in: app); preferences.tap()
        XCTAssertTrue(element(app, "preferences.view").waitForExistence(timeout: 5))
        let languageButton = app.descendants(matching: .any).matching(identifier: "language.control").firstMatch
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        languageButton.tap()
        let settingsButton = app.buttons["language.open-settings"]
        XCTAssertTrue(settingsButton.waitForExistence(timeout: 5))
        // Return without opening Settings or changing language, preserving normal navigation.
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(languageButton.waitForExistence(timeout: 5))
        app.navigationBars.buttons.firstMatch.tap()
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

    func testLocalizedGuideHasOneLinkSectionAndNoReviewAcknowledgement() throws {
        let app = try fixtureApp()
        defer { app.terminate() }
        nativeTab(app, title: copy("Profile", "个人中心"), symbol: "person.crop.circle").tap()
        let guides = element(app, "official-setup.open")
        reveal(guides, in: app); guides.tap()
        XCTAssertTrue(element(app, "official-setup.view").waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts[copy("Loading your review status…", "正在加载你的复核状态…")].exists)
        XCTAssertEqual(app.activityIndicators.count, 0, "Bundled guides must not wait for self-reported review status")
        let apple = element(app, "official-guide.apple")
        reveal(apple, in: app); apple.tap()
        XCTAssertTrue(element(app, "official-guide-detail.apple").waitForExistence(timeout: 5))

        // Inspect every reading mode, without opening an external provider link.
        for (part, linkCount) in [("now", 1), ("later", 2), ("details", 3)] {
            let tab = element(app, "official-guide.part.apple.\(part)")
            reveal(tab, in: app, towardStart: true); tab.tap()
            for index in 0..<linkCount {
                let link = element(app, "official-guide-link.apple.\(index)")
                reveal(link, in: app)
                XCTAssertTrue(link.isHittable)
                XCTAssertFalse(link.label.isEmpty)
            }
            app.swipeUp() // Bring any accidental duplicate footer into the accessibility tree.
            XCTAssertFalse(element(app, "official-guide-link.apple.\(linkCount)").exists)
            XCTAssertFalse(app.buttons[copy("Original source links", "原始来源链接")].exists)
            XCTAssertFalse(app.staticTexts[copy("Original source links", "原始来源链接")].exists)
            XCTAssertFalse(app.switches[copy("I reviewed this guide", "我已阅读此指南")].exists)
            XCTAssertFalse(app.staticTexts[copy("I reviewed this guide", "我已阅读此指南")].exists)
            XCTAssertEqual(app.switches.count, 0, "Reading a guide must not ask for an acknowledgement")
            capture("localized-guide-\(part)-links-without-acknowledgement")
        }
    }

    func testLocalizedMatterFiltersUseActualCategoriesAndTranslatedSearch() async throws {
        let app = try fixtureApp()
        defer { app.terminate() }
        // fixtureApp has already validated this exact base as a loopback-only URL.
        // Read expected records without creating, editing or archiving fixture data.
        let base = try XCTUnwrap(app.launchEnvironment["RILLORA_API_BASE_URL"])
        var components = try XCTUnwrap(URLComponents(string: base))
        components.path += "/matters"
        var records: [(id: String, category: String)] = []
        var cursor: String?
        var seenCursors = Set<String>()
        repeat {
            components.queryItems = [URLQueryItem(name: "limit", value: "50")]
            if let cursor { components.queryItems?.append(URLQueryItem(name: "cursor", value: cursor)) }
            var request = URLRequest(url: try XCTUnwrap(components.url), timeoutInterval: 10)
            request.httpMethod = "GET"
            request.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
            let (data, response) = try await URLSession.shared.data(for: request)
            XCTAssertEqual(try XCTUnwrap(response as? HTTPURLResponse).statusCode, 200)
            let page = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
            for matter in try XCTUnwrap(page["matters"] as? [[String: Any]]) {
                records.append((try XCTUnwrap(matter["publicId"] as? String), try XCTUnwrap(matter["category"] as? String)))
            }
            cursor = page["nextCursor"] as? String
            if let cursor {
                guard seenCursors.insert(cursor).inserted else {
                    XCTFail("The local fixture repeated a matter cursor")
                    return
                }
            }
        } while cursor != nil
        XCTAssertGreaterThanOrEqual(Set(records.map(\.category)).count, 2, "Category regression needs at least two fixture categories")
        nativeTab(app, title: copy("Matters", "事项"), symbol: "list.bullet.rectangle").tap()
        XCTAssertTrue(element(app, "matters.list").waitForExistence(timeout: 10))
        for category in ["account", "document", "device", "financial_asset", "debt", "subscription", "crypto_asset"] {
            let filter = element(app, "matters.filter.\(category)")
            reveal(filter, in: app, towardStart: true); filter.tap()
            if let matching = records.first(where: { $0.category == category }) {
                let row = element(app, "matter.open.\(matching.id)")
                reveal(row, in: app)
                XCTAssertTrue(row.exists, "The selected category must retain its own records")
            } else {
                let empty = element(app, "matters.filter-empty")
                reveal(empty, in: app)
                XCTAssertTrue(empty.exists)
                XCTAssertTrue(element(app, "matters.filter-reset").exists)
            }
            for other in records where other.category != category {
                XCTAssertFalse(element(app, "matter.open.\(other.id)").exists, "Category filter leaked \(other.category) into \(category)")
            }
        }
        let all = element(app, "matters.filter.all")
        reveal(all, in: app, towardStart: true); all.tap()
        let first = try XCTUnwrap(records.first)
        let firstRow = element(app, "matter.open.\(first.id)")
        reveal(firstRow, in: app)
        XCTAssertTrue(firstRow.exists, "All must restore records regardless of category")
        let account = try XCTUnwrap(records.first(where: { $0.category == "account" }))
        let accounts = element(app, "matters.filter.account")
        reveal(accounts, in: app, towardStart: true); accounts.tap()
        let search = app.searchFields.firstMatch
        reveal(search, in: app, towardStart: true)
        search.tap(); search.typeText(copy("Online account", "在线账号"))
        XCTAssertTrue(element(app, "matter.open.\(account.id)").waitForExistence(timeout: 5))
        for other in records where other.category != "account" {
            XCTAssertFalse(element(app, "matter.open.\(other.id)").exists)
        }
        capture("localized-category-filter-and-translated-search")
    }

    func testLocalizedIdentityHeaderAndSecondaryPreferencesReturn() throws {
        let app = try fixtureApp()
        defer { app.terminate() }
        nativeTab(app, title: copy("Profile", "个人中心"), symbol: "person.crop.circle").tap()
        let identity = element(app, "profile.identity")
        XCTAssertTrue(identity.waitForExistence(timeout: 10))
        let name = element(app, "profile.identity.name")
        let email = element(app, "profile.identity.email")
        let reference = element(app, "profile.identity.reference")
        let resolvedIdentity = XCTNSPredicateExpectation(predicate: NSPredicate { _, _ in
            name.exists || reference.exists
        }, object: app)
        XCTAssertEqual(XCTWaiter.wait(for: [resolvedIdentity], timeout: 10), .completed)
        XCTAssertTrue(app.staticTexts[copy("Signed-in account", "当前登录账号")].exists)
        if name.exists { XCTAssertFalse(name.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) }
        if email.exists {
            XCTAssertTrue(email.label.contains("@"))
        } else {
            // The older loopback fixture may use account/profile fallback, which has no email.
            XCTAssertEqual(reference.label, copy("Account reference: 11111111", "账号标识：11111111"))
        }
        XCTAssertFalse(element(app, "language.control").exists)
        XCTAssertFalse(element(app, "appearance.control").exists)
        capture("localized-signed-in-identity-header")
        let preferences = element(app, "profile.preferences")
        reveal(preferences, in: app); preferences.tap()
        XCTAssertTrue(element(app, "preferences.view").waitForExistence(timeout: 5))
        let appearance = element(app, "preferences.appearance")
        reveal(appearance, in: app)
        let originalAppearance = appearance.value as? String
        XCTAssertNotNil(originalAppearance, "Appearance must expose its current selection")
        for mode in ["system", "light", "dark"] {
            let choice = element(app, "appearance.\(mode)")
            reveal(choice, in: app)
            XCTAssertTrue(choice.isHittable)
        }
        let language = element(app, "language.control")
        reveal(language, in: app, towardStart: true); language.tap()
        XCTAssertTrue(element(app, "language.view").waitForExistence(timeout: 5))
        XCTAssertTrue(element(app, "language.open-settings").exists)
        // Do not open system Settings or change the simulator's stored preferences.
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(element(app, "preferences.view").waitForExistence(timeout: 5))
        XCTAssertEqual(appearance.value as? String, originalAppearance)
        app.navigationBars.buttons.firstMatch.tap()
        XCTAssertTrue(element(app, "profile.list").waitForExistence(timeout: 5))
        reveal(identity, in: app, towardStart: true)
        XCTAssertTrue(identity.exists)
        XCTAssertTrue(nativeTab(app, title: copy("Profile", "个人中心"), symbol: "person.crop.circle").isSelected)
        XCTAssertFalse(element(app, "language.control").exists)
        XCTAssertFalse(element(app, "appearance.control").exists)
        capture("localized-preferences-return-to-profile")
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
        let preferences = element(app, "profile.preferences")
        reveal(preferences, in: app); preferences.tap()
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
