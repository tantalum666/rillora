import XCTest
import CoreImage

@MainActor
final class RilloraLayoutMatrixTests: XCTestCase {
    private var app: XCUIApplication!

    func testSharingControlsSupportLargeTextAndSafeDismissal() async throws {
        let created = try await sharingRequest("trusted-contacts", method: "POST", body: ["displayName": "QA large-type sharing"])
        let person = try XCTUnwrap(created["trustedContact"] as? [String: Any])
        let personID = try XCTUnwrap(person["publicId"] as? String)
        let items = try await sharingRequest("matters")["matters"] as? [[String: Any]] ?? []
        let matterID = try XCTUnwrap(items.first?["publicId"] as? String)
        launchApp(environment: ["RILLORA_UI_TEST_LARGE_TEXT": "1", "RILLORA_UI_TEST_REDUCE_MOTION": "1"])
        tab("Profile").tap()
        let open = element("contact.open.\(personID)")
        scroll(open, intoViewWithin: element("profile.list")); open.tap()
        let page = element("sharing.editor")
        XCTAssertTrue(page.waitForExistence(timeout: 10))
        let toggle = element("sharing.matter.\(matterID)")
        scroll(toggle, intoViewWithin: page); toggle.tap()
        let level = element("sharing.level.\(matterID).directions")
        scroll(level, intoViewWithin: page); level.tap()
        assertMinimumTarget(level, label: "Sharing detail level")
        assertVisibleTextFitsWidth()
        attachScreenshot("sharing-ax5-permissions")
        tapNavigationButton(named: "Done")
        XCTAssertTrue(app.alerts.buttons["Keep editing"].waitForExistence(timeout: 5))
        app.alerts.buttons["Keep editing"].tap()
        XCTAssertTrue(page.exists)
        tapNavigationButton(named: "Done"); app.alerts.buttons["Discard changes"].tap()
        _ = try await sharingRequest("trusted-contacts/\(personID)", method: "PATCH", body: ["expectedVersion": 1, "status": "archived"])
    }

    func testAccountBoundInvitationAndRecipientPrivacy() async throws {
        let parent = "c6a631bb-f907-4260-aaae-58b116738a27"
        let friend = "d30d0270-4520-49b6-bef2-9d7dc2b4376c"
        let suffix = String(UUID().uuidString.prefix(6))
        let name = "QA Native Parent \(suffix)"
        let first = try await sharingFixtureMatter("QA name only \(suffix)")
        let second = try await sharingFixtureMatter("QA directions \(suffix)")
        launchApp()
        tab("Profile").tap()
        let add = element("contact.add")
        scroll(add, intoViewWithin: element("profile.list")); add.tap()
        let field = app.textFields["contact.edit.name"]
        XCTAssertTrue(field.waitForExistence(timeout: 5)); field.tap(); field.typeText(name)
        element("contact.edit.save").tap()
        let page = element("sharing.editor")
        XCTAssertTrue(page.waitForExistence(timeout: 10))
        let email = app.textFields["sharing.recipient-email"]
        scroll(email, intoViewWithin: page); email.tap(); email.typeText("\(parent)@example.test")
        email.typeText(XCUIKeyboardKey.return.rawValue)
        for id in [first, second] {
            let toggle = element("sharing.matter.\(id)")
            scroll(toggle, intoViewWithin: page); toggle.tap()
        }
        let details = element("sharing.level.\(second).directions")
        scroll(details, intoViewWithin: page); details.tap()
        attachScreenshot("sharing-owner-permissions")
        let save = element("sharing.save")
        scroll(save, intoViewWithin: page); XCTAssertTrue(save.isEnabled); save.tap()
        let copy = element("sharing.invitation.copy")
        XCTAssertTrue(copy.waitForExistence(timeout: 15))
        scroll(copy, intoViewWithin: page)
        attachScreenshot("sharing-real-qr")
        let detector = try XCTUnwrap(CIDetector(ofType: CIDetectorTypeQRCode, context: nil, options: [CIDetectorAccuracy: CIDetectorAccuracyHigh]))
        let screenshot = try XCTUnwrap(CIImage(data: XCUIScreen.main.screenshot().pngRepresentation))
        let link = try XCTUnwrap((detector.features(in: screenshot).first as? CIQRCodeFeature)?.messageString, "The rendered invitation QR must decode")
        let components = try XCTUnwrap(URLComponents(string: link))
        XCTAssertEqual(components.host, "127.0.0.1")
        let fragment = try XCTUnwrap(components.fragment)
        let token = try XCTUnwrap(URLComponents(string: "?\(fragment)")?.queryItems?.first(where: { $0.name == "invitation" })?.value)
        copy.tap(); XCTAssertTrue(app.staticTexts["Copied"].exists || app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "Copied")).firstMatch.exists)
        let people = try await sharingRequest("trusted-contacts")["trustedContacts"] as? [[String: Any]] ?? []
        let contact = try XCTUnwrap(people.first { $0["displayName"] as? String == name })
        let contactID = try XCTUnwrap(contact["publicId"] as? String)

        launchApp(environment: ["RILLORA_DEV_PLANNER_ID": parent, "RILLORA_UI_TEST_INVITATION_TOKEN": token], expectedRoot: "invitation.view")
        XCTAssertTrue(element("invitation.view").waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["QA directions \(suffix)"].exists)
        XCTAssertTrue(element("invitation.accept").waitForExistence(timeout: 15))
        element("invitation.accept").tap()
        XCTAssertTrue(element("shared.inbox").waitForExistence(timeout: 15))
        attachScreenshot("sharing-parent-inbox")
        element("shared.item.\(first)").tap()
        XCTAssertTrue(element("shared.detail").waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Where to find it"].exists)
        XCTAssertFalse(app.staticTexts["Masked hint"].exists)
        attachScreenshot("sharing-parent-name-only")

        launchApp(environment: ["RILLORA_DEV_PLANNER_ID": friend, "RILLORA_UI_TEST_INVITATION_TOKEN": token], expectedRoot: "invitation.view")
        XCTAssertTrue(element("invitation.view").waitForExistence(timeout: 10))
        XCTAssertTrue(element("invitation.accept").waitForExistence(timeout: 15))
        element("invitation.accept").tap()
        XCTAssertTrue(element("invitation.error").waitForExistence(timeout: 10))
        XCTAssertFalse(element("shared.inbox").exists)
        attachScreenshot("sharing-wrong-recipient")

        launchApp(); tab("Profile").tap()
        let open = element("contact.open.\(contactID)")
        scroll(open, intoViewWithin: element("profile.list")); open.tap()
        XCTAssertTrue(element("sharing.editor").waitForExistence(timeout: 10))
        let revoke = element("sharing.revoke")
        scroll(revoke, intoViewWithin: element("sharing.editor")); revoke.tap()
        app.alerts.buttons["Stop sharing"].tap()
        let stopped = element("sharing.revoked")
        scroll(stopped, intoViewWithin: element("sharing.editor"))
        XCTAssertTrue(stopped.waitForExistence(timeout: 10))
        attachScreenshot("sharing-revoked")
        _ = try await sharingRequest("trusted-contacts/\(contactID)", method: "PATCH", body: ["expectedVersion": 1, "status": "archived"])
        for id in [first, second] { _ = try await sharingRequest("matters/\(id)", method: "DELETE", version: 1) }
    }

    private func sharingFixtureMatter(_ title: String) async throws -> String {
        let response = try await sharingRequest("matters", method: "POST", body: [
            "category": "document", "title": title, "institutionName": "QA archive", "locationHint": "QA blue folder",
            "accountHint": "ending 42", "valueBand": "unknown", "currencyCode": "USD", "importance": "important",
            "desiredOutcome": "notify", "status": "draft"
        ])
        return try XCTUnwrap((response["matter"] as? [String: Any])?["publicId"] as? String)
    }
    private func sharingRequest(_ path: String, method: String = "GET", body: [String: Any]? = nil, version: Int? = nil) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "http://127.0.0.1:4181/v1/\(path)")!)
        request.httpMethod = method
        request.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        if let version { request.setValue(String(version), forHTTPHeaderField: "If-Match") }
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = try XCTUnwrap(response as? HTTPURLResponse).statusCode
        XCTAssertTrue((200..<300).contains(status), "Local sharing fixture request failed: \(status)")
        return data.isEmpty ? [:] : try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }

    private func launchApp(environment: [String: String] = [:], expectedRoot: String = "overview.scroll") {
        continueAfterFailure = false
        if app != nil {
            app.terminate()
        }
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchEnvironment.merge(environment) { _, new in new }
        app.launch()
        let overview = element(expectedRoot)
        if !overview.waitForExistence(timeout: 20) {
            let retry = element("overview.retry")
            if retry.isHittable {
                retry.tap()
            }
        }
        XCTAssertTrue(
            overview.waitForExistence(timeout: 20),
            "The authenticated local QA overview did not load. Confirm the API and explicit QA build settings."
        )
    }

    private func launchSignedOutApp(environment: [String: String] = [:]) {
        continueAfterFailure = false
        if app != nil {
            app.terminate()
        }
        XCUIDevice.shared.orientation = .portrait
        app = XCUIApplication()
        app.launchEnvironment["RILLORA_DEV_PLANNER_ID"] = ""
        app.launchEnvironment["RILLORA_UI_TEST_FORCE_SIGNED_OUT"] = "1"
        app.launchEnvironment.merge(environment) { _, new in new }
        app.launch()
        XCTAssertTrue(
            element("public-overview.scroll").waitForExistence(timeout: 20),
            "Signed-out launch must show the public Overview instead of an authentication wall."
        )
    }

    func testSignedOutExperienceUsesHostedAuthentication() {
        launchSignedOutApp()
        assertNativeTabs()

        XCTAssertFalse(element("overview.retry").exists)
        XCTAssertFalse(app.staticTexts["Sign-in required"].exists)
        XCTAssertFalse(element("account-entry.view").exists)
        XCTAssertFalse(app.staticTexts["Map what matters"].exists)
        XCTAssertFalse(app.staticTexts["Your plan is not public content"].exists)
        XCTAssertFalse(element("public-overview.account").exists)
        XCTAssertTrue(element("public-overview.hero").exists)
        XCTAssertTrue(element("public-overview.purpose").exists)
        attachScreenshot("signed-out-overview")

        let overviewScroll = element("public-overview.scroll")
        let firstIndex = element("public-overview.focus.what")
        let secondIndex = element("public-overview.focus.next")
        XCTAssertTrue(firstIndex.exists)
        XCTAssertTrue(secondIndex.exists)
        XCTAssertTrue(element("public-overview.focus.who").exists)
        XCTAssertFalse(element("public-overview.index-detail.1").exists)
        XCTAssertFalse(element("public-overview.index-detail.2").exists)
        XCTAssertFalse(app.staticTexts["Synthetic example"].exists)
        XCTAssertFalse(app.staticTexts["Safe example"].exists)

        let startPlan = element("public-overview.start-final")
        scroll(startPlan, intoViewWithin: overviewScroll)
        assertMinimumTarget(startPlan, label: "Create my private map")
        XCTAssertTrue(app.staticTexts["Death"].exists)
        XCTAssertTrue(app.staticTexts["Incapacity"].exists)
        XCTAssertTrue(app.staticTexts["Unreachable"].exists)
        XCTAssertFalse(app.staticTexts["Rillora never treats silence or payment status as proof—and never stores a password."].exists)
        XCTAssertFalse(element("account-entry.view").exists)

        tab("Matters").tap()
        XCTAssertTrue(element("public-matters.scroll").waitForExistence(timeout: 10))
        XCTAssertFalse(element("matter.add").exists)
        let addMatter = element("public-matters.start")
        scroll(addMatter, intoViewWithin: element("public-matters.scroll"))
        assertMinimumTarget(addMatter, label: "Add a matter")
        assertNoCommercialCopyBeforeIntent()
        attachScreenshot("signed-out-matters")
        XCTAssertFalse(element("account-entry.view").exists)

        tab("Profile").tap()
        let publicProfile = element("public-profile.list")
        XCTAssertTrue(publicProfile.waitForExistence(timeout: 10))
        assertNativeTabs(selected: "Profile")

        XCTAssertFalse(element("public-profile.plan-access").exists)
        XCTAssertFalse(app.staticTexts["Rillora Family"].exists)

        let account = element("public-profile.sign-in")
        scroll(account, intoViewWithin: publicProfile)
        XCTAssertTrue(account.isHittable)
        XCTAssertTrue(account.label.contains("Sign in / Sign up"))
        XCTAssertTrue(account.label.contains("Access your private map"))
        assertMinimumTarget(account, label: "Profile account access")
        XCTAssertFalse(app.staticTexts["Security boundary"].exists)
        assertNoCommercialCopyBeforeIntent()
        XCTAssertFalse(element("profile.list").exists)
        XCTAssertFalse(element("account-entry.view").exists)
        XCTAssertFalse(element("account-entry.create").exists)
        XCTAssertFalse(element("account-entry.sign-in").exists)
        XCTAssertFalse(element("account-entry.apple").exists)
        XCTAssertFalse(element("account-entry.google").exists)

        XCTAssertFalse(element("public-profile.example").exists)
        XCTAssertFalse(element("public-profile.iphone-settings").exists)
        XCTAssertFalse(element("public-profile.how-it-works").exists)
        XCTAssertFalse(element("public-profile.settings").exists)

        let safety = element("public-profile.safety")
        scroll(safety, intoViewWithin: publicProfile)
        XCTAssertTrue(safety.isHittable)
        safety.tap()
        let safetyView = element("profile.safety.view")
        XCTAssertTrue(safetyView.waitForExistence(timeout: 10))
        XCTAssertEqual(
            app.staticTexts.matching(NSPredicate(format: "label == %@", "Safety & privacy")).count,
            1
        )

        let safeInformation = element("profile.safety.safe-information")
        XCTAssertTrue(safeInformation.isHittable)
        safeInformation.tap()
        XCTAssertTrue(element("profile.safety.safe-information.view").waitForExistence(timeout: 10))
        attachScreenshot("signed-out-profile-safe-information")
        tapFirstBackButton()
        XCTAssertTrue(safetyView.waitForExistence(timeout: 5))

        let disclosure = element("profile.safety.disclosure")
        scroll(disclosure, intoViewWithin: safetyView)
        XCTAssertTrue(disclosure.isHittable)
        disclosure.tap()
        XCTAssertTrue(element("profile.safety.disclosure.view").waitForExistence(timeout: 10))
        let deathDisclosure = element("profile.safety.disclosure.death")
        XCTAssertTrue(deathDisclosure.isHittable)
        deathDisclosure.tap()
        XCTAssertTrue(app.staticTexts["A report starts evidence checks. It does not release a matter by itself."].exists)
        attachScreenshot("signed-out-profile-disclosure-safeguards")
        tapFirstBackButton()
        XCTAssertTrue(safetyView.waitForExistence(timeout: 5))
        tapFirstBackButton()
        XCTAssertTrue(publicProfile.waitForExistence(timeout: 5))

        let about = element("public-profile.about")
        scroll(about, intoViewWithin: publicProfile)
        XCTAssertTrue(about.isHittable)
        about.tap()
        XCTAssertTrue(element("profile.about.view").waitForExistence(timeout: 10))
        let copyAppInformation = element("profile.about.copy")
        scroll(copyAppInformation, intoViewWithin: element("profile.about.view"))
        XCTAssertTrue(copyAppInformation.isHittable)
        copyAppInformation.tap()
        XCTAssertTrue(copyAppInformation.label.contains("Copied"))
        attachScreenshot("signed-out-profile-about")
        tapFirstBackButton()
        XCTAssertTrue(publicProfile.waitForExistence(timeout: 5))
        attachScreenshot("signed-out-profile")
    }

    func testPublicExplorerAndCategoriesStayOutsideAuthentication() {
        launchSignedOutApp()
        let overview = element("public-overview.scroll")
        let who = element("public-overview.focus.who")
        scroll(who, intoViewWithin: overview)
        who.tap()
        XCTAssertTrue(app.staticTexts["Choose who can help."].waitForExistence(timeout: 5))
        attachScreenshot("public-motion-who")
        element("public-overview.focus.next").tap()
        XCTAssertTrue(app.staticTexts["Your wishes: keep, transfer or close."].waitForExistence(timeout: 5))
        attachScreenshot("public-motion-next")
        element("public-overview.focus.what").tap()
        XCTAssertTrue(app.staticTexts["Accounts · Documents · Devices"].waitForExistence(timeout: 5))
        attachScreenshot("public-motion-what")

        let explore = element("public-overview.explore")
        scroll(explore, intoViewWithin: overview)
        explore.tap()
        let matters = element("public-matters.scroll")
        XCTAssertTrue(matters.waitForExistence(timeout: 5))
        let documents = element("public-matters.category.documents")
        scroll(documents, intoViewWithin: matters)
        documents.tap()
        XCTAssertTrue(element("public-matters.guidance.documents").waitForExistence(timeout: 5))
        attachScreenshot("public-category-documents")
        let devices = element("public-matters.category.devices")
        scroll(devices, intoViewWithin: matters)
        devices.tap()
        XCTAssertTrue(element("public-matters.guidance.devices").waitForExistence(timeout: 5))
        XCTAssertFalse(element("public-matters.guidance.documents").exists)
        XCTAssertFalse(element("matter.editor").exists)
        XCTAssertFalse(XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch.exists)
        attachScreenshot("public-category-devices")
    }

    func testExpiredSessionKeepsPublicExploration() {
        launchSignedOutApp(environment: ["RILLORA_UI_TEST_EXPIRED_SESSION": "1"])
        XCTAssertFalse(app.staticTexts["Welcome back"].exists)
        XCTAssertTrue(element("public-overview.explorer").exists)
        XCTAssertFalse(element("overview.scroll").exists)
        element("public-overview.focus.who").tap()
        XCTAssertTrue(app.staticTexts["Choose who can help."].waitForExistence(timeout: 5))
        attachScreenshot("expired-session-public-overview")
        tab("Matters").tap()
        XCTAssertTrue(element("public-matters.category.documents").waitForExistence(timeout: 5))
        element("public-matters.category.documents").tap()
        XCTAssertTrue(element("public-matters.guidance.documents").waitForExistence(timeout: 5))
        tab("Profile").tap()
        let account = element("public-profile.sign-in")
        XCTAssertTrue(account.waitForExistence(timeout: 5))
        XCTAssertTrue(account.label.contains("Sign in again"))
        attachScreenshot("expired-session-account-context")
    }

    func testPublicExplorationSupportsLargeTextAndReducedMotion() {
        launchSignedOutApp(environment: [
            "RILLORA_UI_TEST_REDUCE_MOTION": "1",
            "RILLORA_UI_TEST_LARGE_TEXT": "1",
        ])
        let overview = element("public-overview.scroll")
        let who = element("public-overview.focus.who")
        scroll(who, intoViewWithin: overview)
        assertMinimumTarget(who, label: "Who can help")
        who.tap()
        XCTAssertTrue(app.staticTexts["Choose who can help."].waitForExistence(timeout: 5))
        attachScreenshot("public-ax5-reduced-motion")
        tab("Matters").tap()
        let matters = element("public-matters.scroll")
        let documents = element("public-matters.category.documents")
        scroll(documents, intoViewWithin: matters)
        documents.tap()
        let guidance = element("public-matters.guidance.documents")
        scroll(guidance, intoViewWithin: matters)
        XCTAssertTrue(guidance.isHittable)
        attachScreenshot("public-categories-ax5")
    }

    func testPrivateIntentsOpenHostedAuthenticationAndCancelBackToSource() {
        launchSignedOutApp()
        let entries = [
            ("Overview", "public-overview.scroll", "public-overview.start-final"),
            ("Matters", "public-matters.scroll", "public-matters.start"),
            ("Profile", "public-profile.list", "public-profile.sign-in"),
        ]
        for (tabName, rootID, entryID) in entries {
            tab(tabName).tap()
            let root = element(rootID)
            XCTAssertTrue(root.waitForExistence(timeout: 10))
            let entry = element(entryID)
            scroll(entry, intoViewWithin: root)
            entry.tap()
            XCTAssertFalse(element("account-access.scroll").exists)
            XCTAssertFalse(element("account-access.email").exists)
            let notice = XCUIApplication(bundleIdentifier: "com.apple.springboard").alerts.firstMatch
            XCTAssertTrue(notice.waitForExistence(timeout: 10))
            XCTAssertTrue(notice.label.contains("login.rillora.xyz"))
            attachScreenshot("hosted-system-notice-\(tabName.lowercased())")
            notice.buttons.matching(NSPredicate(format: "label IN %@", ["Cancel", "取消"])).firstMatch.tap()
            XCTAssertTrue(root.waitForExistence(timeout: 10))
            XCTAssertFalse(notice.exists)
            XCTAssertFalse(element("account-access.scroll").exists)
        }
    }

    func testSignedOutCommercialDetailsStayDeferred() {
        launchSignedOutApp()
        XCTAssertFalse(app.staticTexts["Rillora Family"].exists)
        XCTAssertFalse(app.staticTexts["US$8.99 monthly  ·  US$89 yearly"].exists)

        tab("Profile").tap()
        XCTAssertTrue(element("public-profile.list").waitForExistence(timeout: 10))
        XCTAssertFalse(element("public-profile.plan-access").exists)
        XCTAssertFalse(app.staticTexts["Rillora Family"].exists)
        XCTAssertFalse(app.staticTexts["Planned Rillora Family"].exists)
        XCTAssertTrue(element("public-profile.sign-in").exists)
        assertNoCommercialCopyBeforeIntent()
        attachScreenshot("signed-out-commercial-details-deferred")
    }

    private func assertNoCommercialCopyBeforeIntent() {
        XCTAssertEqual(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "free plan")).count,
            0
        )
        XCTAssertEqual(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "no card")).count,
            0
        )
    }

    func testRootDestinationsPortrait() {
        launchApp()
        assertNativeTabs()

        let overview = element("overview.scroll")
        XCTAssertTrue(overview.exists)
        let primaryAction = element("overview.review-next")
        scroll(primaryAction, intoViewWithin: overview)
        assertMinimumTarget(primaryAction, label: "Overview primary action")
        attachScreenshot("overview-portrait")

        tab("Matters").tap()
        XCTAssertTrue(element("matters.list").waitForExistence(timeout: 10))
        assertNativeTabs(selected: "Matters")
        attachScreenshot("matters-portrait")

        tab("Profile").tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 10))
        assertNativeTabs(selected: "Profile")
        attachScreenshot("profile-portrait")
    }

    func testAuthenticatedRootsUseCondensedHierarchy() {
        launchApp()

        let overview = element("overview.scroll")
        XCTAssertTrue(overview.waitForExistence(timeout: 10))
        let invite = element("overview.invite")
        scroll(invite, intoViewWithin: overview)
        assertMinimumTarget(invite, label: "Invite someone")
        XCTAssertEqual(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "Keep going")).count,
            0
        )
        XCTAssertEqual(
            app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] %@", "No matters added yet")).count,
            0
        )

        tab("Profile").tap()
        let profile = element("profile.list")
        XCTAssertTrue(profile.waitForExistence(timeout: 10))
        XCTAssertFalse(app.staticTexts["Policy version"].exists)
        XCTAssertEqual(
            app.staticTexts.matching(
                NSPredicate(format: "label CONTAINS[c] %@", "executor appointment")
            ).count,
            0
        )

        for identifier in [
            "contact.add",
            "shared.open",
            "plan-access.open",
            "maintenance.open",
            "official-setup.open",
            "start-here.open",
        ] {
            let tool = element(identifier)
            scroll(tool, intoViewWithin: profile)
            XCTAssertTrue(tool.isHittable, "Condensed Profile tool \(identifier) is not reachable")
        }
    }

    func testOrientationChangeKeepsRootsReachable() {
        launchApp(environment: ["RILLORA_UI_TEST_LANDSCAPE": "1"])
        XCUIDevice.shared.orientation = .landscapeLeft
        for _ in 0..<20 {
            if app.frame.width > app.frame.height { break }
            Thread.sleep(forTimeInterval: 0.15)
        }
        XCTAssertGreaterThan(app.frame.width, app.frame.height, "The app must actually rotate, not merely receive a device orientation command.")
        XCTAssertTrue(element("overview.scroll").waitForExistence(timeout: 10))
        assertNativeTabs(minimumTabHeight: 36)
        attachScreenshot("overview-landscape")

        tab("Matters").tap()
        XCTAssertTrue(element("matters.list").waitForExistence(timeout: 10))
        assertNativeTabs(selected: "Matters", minimumTabHeight: 36)
        attachScreenshot("matters-landscape")

        tab("Profile").tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 10))
        assertNativeTabs(selected: "Profile", minimumTabHeight: 36)
        attachScreenshot("profile-landscape")
        XCUIDevice.shared.orientation = .portrait
    }

    func testPrimaryEditorsAndPreparationRoutes() {
        launchApp()
        tab("Matters").tap()
        XCTAssertTrue(element("matters.list").waitForExistence(timeout: 10))

        let addMatter = element("matter.add")
        XCTAssertTrue(addMatter.waitForExistence(timeout: 5))
        addMatter.tap()
        XCTAssertTrue(element("matter.editor").waitForExistence(timeout: 10))
        XCTAssertTrue(element("matter.edit.title").exists)
        attachScreenshot("new-matter-editor")
        tapNavigationButton(named: "Cancel")

        let existingMatter = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Bank account")).firstMatch
        scroll(existingMatter, intoViewWithin: element("matters.list"))
        XCTAssertTrue(existingMatter.waitForExistence(timeout: 10))
        existingMatter.tap()
        XCTAssertTrue(element("matter.editor").waitForExistence(timeout: 10))
        element("matter.section.people").tap()
        let rolePolicy = element("matter.edit.role-policy")
        scroll(rolePolicy, intoViewWithin: element("matter.editor"))
        XCTAssertTrue(rolePolicy.isHittable)
        rolePolicy.tap()
        XCTAssertTrue(element("role-policy.editor").waitForExistence(timeout: 10))
        attachScreenshot("role-policy-editor")
        tapFirstBackButton()
        XCTAssertTrue(element("matter.editor").waitForExistence(timeout: 5))
        tapFirstBackButton()
        XCTAssertTrue(element("matters.list").waitForExistence(timeout: 5))

        tab("Profile").tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 10))
        let profileList = element("profile.list")

        openPushRoute(
            "plan-access.open",
            labelPrefix: "Plan & access",
            expected: "plan-access.view",
            screenshot: "plan-access"
        )

        openSheetRoute("contact.add", expected: "contact.editor", screenshot: "contact-editor")
        tapNavigationButton(named: "Cancel")
        XCTAssertTrue(profileList.waitForExistence(timeout: 5))

        openPushRoute(
            "plan-motivation.open",
            labelPrefix: "Why I’m preparing",
            expected: "plan-motivation.view",
            screenshot: "plan-motivation"
        )
        openOfficialProviderGuide()
        openPushRoute(
            "simulation.open",
            labelPrefix: "Simulation rehearsal",
            expected: "simulation.view",
            screenshot: "simulation"
        )
        openPushRoute(
            "disclosure-rehearsal.open",
            labelPrefix: "Role disclosure rehearsal",
            expected: "disclosure-rehearsal.view",
            screenshot: "role-disclosure"
        )
        openPushRoute(
            "start-here.open",
            labelPrefix: "Start Here guide",
            expected: "start-here.view",
            screenshot: "start-here"
        )
        openPushRoute(
            "profile.safety",
            labelPrefix: "Safety & privacy",
            expected: "profile.safety.view",
            screenshot: "profile-safety"
        )
        openPushRoute(
            "profile.about",
            labelPrefix: "About Rillora",
            expected: "profile.about.view",
            screenshot: "profile-about"
        )
    }

    func testOverviewOpensTheNamedMatterAndProtectsUnsavedEdits() {
        launchApp()
        let next = element("overview.review-next")
        scroll(next, intoViewWithin: element("overview.scroll"))
        XCTAssertTrue(next.label.contains("Insurance"))
        next.tap()
        XCTAssertTrue(element("matter.editor").waitForExistence(timeout: 10))
        let title = app.textFields["matter.edit.title"]
        XCTAssertEqual(title.value as? String, "Insurance")
        title.tap()
        title.typeText(" QA unsaved")
        XCTAssertTrue(app.staticTexts["Name · Required"].exists)
        tapNavigationButton(named: "Back")
        let keepEditing = app.buttons["Keep editing"].firstMatch
        XCTAssertTrue(keepEditing.waitForExistence(timeout: 5))
        attachScreenshot("matter-unsaved-confirmation")
        keepEditing.tap()
        XCTAssertTrue((title.value as? String)?.contains("QA unsaved") == true)
        tapNavigationButton(named: "Back")
        app.buttons["Discard changes"].firstMatch.tap()
        XCTAssertTrue(element("overview.scroll").waitForExistence(timeout: 10))
        next.tap()
        XCTAssertTrue(title.waitForExistence(timeout: 10))
        XCTAssertEqual(title.value as? String, "Insurance")
    }

    func testMatterSearchAndContactDraftRecovery() {
        launchApp()
        tab("Matters").tap()
        let search = app.searchFields.firstMatch
        if !search.isHittable { app.swipeDown() }
        XCTAssertTrue(search.waitForExistence(timeout: 5))
        search.tap()
        search.typeText("no-match-ux-qa")
        XCTAssertTrue(element("matters.search-empty").waitForExistence(timeout: 5))
        attachScreenshot("matters-search-empty")
        search.buttons.firstMatch.tap()
        search.typeText("Insurance")
        XCTAssertTrue(element(withIdentifierPrefix: "matter.open.").waitForExistence(timeout: 5))
        attachScreenshot("matters-search-result")

        openProfileFresh()
        openSheetRoute("contact.add", expected: "contact.editor", screenshot: "contact-empty")
        let name = app.textFields["contact.edit.name"]
        name.tap()
        name.typeText("Draft contact")
        XCTAssertTrue(app.staticTexts["Name · Required"].exists)
        tapNavigationButton(named: "Cancel")
        XCTAssertTrue(app.buttons["Keep editing"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["Keep editing"].firstMatch.tap()
        XCTAssertEqual(name.value as? String, "Draft contact")
        attachScreenshot("contact-draft-retained")
        tapNavigationButton(named: "Cancel")
        app.buttons["Discard changes"].firstMatch.tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 5))
    }

    func testPreparationResultsAndExportChoices() {
        openProfileFresh()
        let profile = element("profile.list")
        let simulation = element("simulation.open")
        scroll(simulation, intoViewWithin: profile)
        attachScreenshot("profile-preparation")
        simulation.tap()
        let run = element("simulation.run")
        XCTAssertTrue(run.waitForExistence(timeout: 5))
        scroll(run, intoViewWithin: element("simulation.view"))
        run.tap()
        XCTAssertTrue(element("simulation.result").waitForExistence(timeout: 15))
        attachScreenshot("simulation-result")
        tapFirstBackButton()
        let disclosure = element("disclosure-rehearsal.open")
        scroll(disclosure, intoViewWithin: profile)
        disclosure.tap()
        let create = element("disclosure-rehearsal.create")
        scroll(create, intoViewWithin: element("disclosure-rehearsal.view"))
        create.tap()
        XCTAssertTrue(element("disclosure-rehearsal.state").waitForExistence(timeout: 15))
        attachScreenshot("role-disclosure-result")
        tapFirstBackButton()
        let startHere = element("start-here.open")
        scroll(startHere, intoViewWithin: profile)
        startHere.tap()
        let preview = element("start-here.preview")
        scroll(preview, intoViewWithin: element("start-here.view"))
        preview.tap()
        let result = element("start-here.preview-result")
        XCTAssertTrue(result.waitForExistence(timeout: 15))
        attachScreenshot("start-here-preview")
        let chooseFormat = element("start-here.choose-format")
        scroll(chooseFormat, intoViewWithin: element("start-here.view"))
        chooseFormat.tap()
        let format = element("start-here.format")
        XCTAssertTrue(format.waitForExistence(timeout: 5))
        attachScreenshot("start-here-format-choices")
        element("start-here.format-continue").tap()
        let printable = element("start-here.printable")
        scroll(printable, intoViewWithin: element("start-here.view"))
        XCTAssertFalse(printable.isEnabled)
        attachScreenshot("start-here-printable-choice")
        element("start-here.step.format").tap()
        element("start-here.format.encrypted").tap()
        element("start-here.format-continue").tap()
        let encrypted = element("start-here.encrypted")
        scroll(encrypted, intoViewWithin: element("start-here.view"))
        XCTAssertFalse(encrypted.isEnabled)
        XCTAssertFalse(element("start-here.printable").exists)
        attachScreenshot("start-here-encrypted-choice")
    }

    func testEditorSectionsKeepTheSameUnsavedDraft() {
        launchApp()
        tab("Matters").tap()
        element("matter.add").tap()
        let name = app.textFields["matter.edit.title"]
        XCTAssertTrue(name.waitForExistence(timeout: 5))
        name.tap(); name.typeText("Section draft")
        element("matter.section.directions").tap()
        let outcome = element("matter.outcome.close")
        scroll(outcome, intoViewWithin: element("matter.editor"))
        outcome.tap()
        attachScreenshot("matter-directions-selected")
        element("matter.section.people").tap()
        XCTAssertTrue(app.staticTexts["Save this matter before adding people."].waitForExistence(timeout: 5))
        attachScreenshot("new-matter-people-boundary")
        element("matter.section.details").tap()
        XCTAssertEqual(name.value as? String, "Section draft")
        tapNavigationButton(named: "Cancel")
        XCTAssertTrue(app.buttons["Keep editing"].firstMatch.waitForExistence(timeout: 5))
        app.buttons["Keep editing"].firstMatch.tap()
        XCTAssertEqual(name.value as? String, "Section draft")
        tapNavigationButton(named: "Cancel")
        app.buttons["Discard changes"].firstMatch.tap()
        XCTAssertTrue(element("matters.list").waitForExistence(timeout: 5))
    }

    func testEveryOfficialGuideAndItsDetailsRemainReachable() {
        openProfileFresh()
        let route = element("official-setup.open")
        scroll(route, intoViewWithin: element("profile.list")); route.tap()
        let directory = element("official-setup.view")
        XCTAssertTrue(directory.waitForExistence(timeout: 5))
        attachScreenshot("official-directory")
        for provider in ["apple", "google", "meta", "github", "password_manager", "microsoft", "linkedin", "x", "paypal", "coinbase", "binance"] {
            let entry = element("official-guide.\(provider)")
            scroll(entry, intoViewWithin: directory); entry.tap()
            let page = element("official-guide-detail.\(provider)")
            XCTAssertTrue(page.waitForExistence(timeout: 5))
            XCTAssertTrue(element("official-guide-link.\(provider).0").exists)
            let next = element("official-guide.next.\(provider)")
            scroll(next, intoViewWithin: page)
            if next.isEnabled { next.tap() }
            attachScreenshot("guide-\(provider)-step")
            let details = element("official-guide.part.\(provider).details")
            scroll(details, intoViewWithin: page); details.tap()
            attachScreenshot("guide-\(provider)-details")
            tapFirstBackButton()
            XCTAssertTrue(directory.waitForExistence(timeout: 5))
        }
    }

    func testRehearsalSwitchClearsOldResultAndPolicyActionsAdvance() {
        openProfileFresh()
        let profile = element("profile.list")
        let simulation = element("simulation.open")
        scroll(simulation, intoViewWithin: profile); simulation.tap()
        element("simulation.event.incapacity").tap()
        attachScreenshot("rehearsal-incapacity-selection")
        let run = element("simulation.run")
        scroll(run, intoViewWithin: element("simulation.view")); run.tap()
        XCTAssertTrue(element("simulation.result").waitForExistence(timeout: 15))
        attachScreenshot("rehearsal-incapacity-result")
        element("simulation.event.missing").tap()
        XCTAssertFalse(element("simulation.result").exists)
        attachScreenshot("rehearsal-new-event-clears-result")
        tapFirstBackButton()
        let disclosure = element("disclosure-rehearsal.open")
        scroll(disclosure, intoViewWithin: profile); disclosure.tap()
        let create = element("disclosure-rehearsal.create")
        scroll(create, intoViewWithin: element("disclosure-rehearsal.view")); create.tap()
        let state = element("disclosure-rehearsal.state")
        XCTAssertTrue(state.waitForExistence(timeout: 15))
        for step in 0..<7 {
            let advance = element("disclosure-rehearsal.action.advance")
            let hold = element("disclosure-rehearsal.action.simulate_cooling_off_elapsed")
            let action = advance.exists ? advance : hold
            guard action.exists else { break }
            let previous = state.label
            scroll(action, intoViewWithin: element("disclosure-rehearsal.view")); action.tap()
            let changed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "label != %@", previous), object: state)
            XCTAssertEqual(XCTWaiter.wait(for: [changed], timeout: 15), .completed)
            attachScreenshot("disclosure-state-\(step + 1)")
        }
    }

    func testDeepTasksSupportLargeTextAndReducedMotion() {
        launchApp(environment: ["RILLORA_UI_TEST_LARGE_TEXT": "1", "RILLORA_UI_TEST_REDUCE_MOTION": "1"])
        tab("Matters").tap(); element("matter.add").tap()
        let editor = element("matter.editor")
        XCTAssertGreaterThan(element("matter.section.directions").frame.minY, element("matter.section.details").frame.minY,
                             "Large-text sheets must actually receive the accessibility size, with stacked section controls")
        let name = app.textFields["matter.edit.title"]
        scroll(name, intoViewWithin: editor)
        assertMinimumTarget(element("matter.edit.title.control"), label: "Matter name control")
        element("matter.edit.title.control").coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.85)).tap()
        XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout: 5))
        name.typeText(XCUIKeyboardKey.return.rawValue)
        assertVisibleTextFitsWidth()
        attachScreenshot("deep-ax5-matter")
        tapNavigationButton(named: "Cancel")
        tab("Profile").tap()
        let start = element("start-here.open")
        scroll(start, intoViewWithin: element("profile.list")); start.tap()
        let preview = element("start-here.preview")
        scroll(preview, intoViewWithin: element("start-here.view")); preview.tap()
        XCTAssertTrue(element("start-here.preview-result").waitForExistence(timeout: 15))
        let formats = element("start-here.step.format")
        scroll(formats, intoViewWithin: element("start-here.view")); formats.tap()
        let encrypted = element("start-here.format.encrypted")
        scroll(encrypted, intoViewWithin: element("start-here.view")); encrypted.tap()
        assertVisibleTextFitsWidth()
        attachScreenshot("deep-ax5-export-formats")
    }

    func testEncryptedGuideKeepsRecoveryKeyUntilExplicitExit() {
        openProfileFresh()
        let start = element("start-here.open")
        scroll(start, intoViewWithin: element("profile.list")); start.tap()
        let page = element("start-here.view")
        let preview = element("start-here.preview")
        scroll(preview, intoViewWithin: page); preview.tap()
        XCTAssertTrue(element("start-here.preview-result").waitForExistence(timeout: 15))
        let formats = element("start-here.step.format")
        scroll(formats, intoViewWithin: page); formats.tap()
        element("start-here.format.encrypted").tap()
        element("start-here.format-continue").tap()
        let create = element("start-here.encrypted")
        scroll(create, intoViewWithin: page)
        XCTAssertFalse(create.isEnabled)
        let recovery = element("start-here.ack.recovery")
        scroll(recovery, intoViewWithin: page); recovery.tap()
        XCTAssertEqual(recovery.value as? String, "1")
        XCTAssertFalse(create.isEnabled)
        let copies = element("start-here.ack.encrypted-copies")
        scroll(copies, intoViewWithin: page); copies.tap()
        XCTAssertEqual(copies.value as? String, "1")
        XCTAssertTrue(create.isEnabled)
        scroll(create, intoViewWithin: page); create.tap()
        let key = element("start-here.share-recovery")
        XCTAssertTrue(key.waitForExistence(timeout: 20))
        attachScreenshot("encrypted-guide-result")
        // Back traverses Save -> Format -> Review before the guarded exit.
        for _ in 0..<3 { tapNavigationButton(named: "Back") }
        XCTAssertTrue(app.buttons["Go to recovery key"].waitForExistence(timeout: 5))
        attachScreenshot("encrypted-guide-exit-protection")
        app.buttons["Go to recovery key"].tap()
        XCTAssertTrue(key.waitForExistence(timeout: 5))
        for _ in 0..<3 { tapNavigationButton(named: "Back") }
        app.buttons["Leave anyway"].tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 5))
    }

    func testEmptyMapAndOptionalGuideRemainUseful() throws {
        guard let plannerID = ProcessInfo.processInfo.environment["RILLORA_UI_QA_EMPTY_PLANNER_ID"] else {
            throw XCTSkip("Requires an explicitly provisioned, empty local QA planner.")
        }
        launchApp(environment: ["RILLORA_DEV_PLANNER_ID": plannerID])
        attachScreenshot("empty-overview")
        let guide = element("first-use.open-guide")
        if guide.exists {
            scroll(guide, intoViewWithin: element("overview.scroll"))
            guide.tap()
        } else {
            tab("Profile").tap()
            let resume = element("first-use.account-open")
            scroll(resume, intoViewWithin: element("profile.list"))
            resume.tap()
        }
        let form = element("first-use.guide")
        XCTAssertTrue(form.waitForExistence(timeout: 10))
        attachScreenshot("optional-guide")
        tapNavigationButton(named: "Save & exit")
        tab("Overview").tap()
        XCTAssertTrue(element("overview.scroll").waitForExistence(timeout: 10))
        tab("Matters").tap()
        XCTAssertTrue(element("matters.empty").waitForExistence(timeout: 10))
        attachScreenshot("empty-matters")
        let add = element("matter.add")
        scroll(add, intoViewWithin: element("matters.empty"))
        add.tap()
        XCTAssertTrue(element("matter.editor").waitForExistence(timeout: 10))
        attachScreenshot("empty-map-new-matter")
        let save = app.buttons["matter.edit.save"]
        let disabled = XCTNSPredicateExpectation(predicate: NSPredicate(format: "enabled == false"), object: save)
        XCTAssertEqual(XCTWaiter.wait(for: [disabled], timeout: 3), .completed)
        tapNavigationButton(named: "Cancel")
        tab("Profile").tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 10))
        attachScreenshot("empty-profile")
    }

    func testInitialConnectionFailureOffersRetry() {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchEnvironment["RILLORA_API_BASE_URL"] = "http://127.0.0.1:1/v1"
        app.launch()
        let retry = element("overview.retry")
        XCTAssertTrue(retry.waitForExistence(timeout: 20))
        assertMinimumTarget(retry, label: "Retry connection")
        attachScreenshot("connection-failure")
        retry.tap()
        XCTAssertTrue(retry.waitForExistence(timeout: 20))
        XCTAssertFalse(element("overview.scroll").exists)
    }

    func testLargeTextEditorsAndRoleScope() {
        launchApp(environment: ["RILLORA_UI_TEST_LARGE_TEXT": "1", "RILLORA_UI_TEST_REDUCE_MOTION": "1"])
        attachScreenshot("large-overview")
        let invite = element("overview.invite")
        scroll(invite, intoViewWithin: element("overview.scroll"))
        assertMinimumTarget(invite, label: "Invite someone")
        attachScreenshot("large-overview-invitation")
        tab("Matters").tap()
        element("matter.add").tap()
        let editor = element("matter.editor")
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        scroll(app.textFields["matter.edit.title"], intoViewWithin: editor)
        assertMinimumTarget(element("matter.edit.title.control"), label: "Matter name control")
        assertVisibleTextFitsWidth()
        attachScreenshot("large-matter-editor")
        let name = app.textFields["matter.edit.title"]
        name.tap()
        name.typeText("QA")
        attachScreenshot("large-matter-typing")
        name.typeText(String(repeating: XCUIKeyboardKey.delete.rawValue, count: 2))
        tapNavigationButton(named: "Cancel")
        let bank = app.buttons.matching(NSPredicate(format: "label BEGINSWITH %@", "Bank account")).firstMatch
        scroll(bank, intoViewWithin: element("matters.list"))
        bank.tap()
        scroll(element("matter.section.people"), intoViewWithin: editor)
        element("matter.section.people").tap()
        let roles = element("matter.edit.role-policy")
        scroll(roles, intoViewWithin: editor)
        roles.tap()
        XCTAssertTrue(element("role-policy.editor").waitForExistence(timeout: 10))
        assertVisibleTextFitsWidth()
        attachScreenshot("large-role-scope")
        tapFirstBackButton()
        tapFirstBackButton()
        tab("Profile").tap()
        openSheetRoute("contact.add", expected: "contact.editor", screenshot: "large-contact-editor")
        assertMinimumTarget(element("contact.edit.name.control"), label: "Contact name control")
        assertVisibleTextFitsWidth()
        tapNavigationButton(named: "Cancel")
    }

    private func assertVisibleTextFitsWidth() {
        for text in app.staticTexts.allElementsBoundByIndex where text.frame.intersects(app.frame) {
            XCTAssertGreaterThanOrEqual(text.frame.minX, app.frame.minX - 1, text.label)
            XCTAssertLessThanOrEqual(text.frame.maxX, app.frame.maxX + 1, text.label)
        }
    }

    func testVisibleActionsExposeLabelsAndMinimumTabTargets() {
        launchApp()
        assertNativeTabs()
        for button in app.buttons.allElementsBoundByIndex where button.exists && button.frame.intersects(app.frame) {
            XCTAssertFalse(
                button.label.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
                "Visible button has no accessibility label: \(button.debugDescription)"
            )
        }
    }

    func testProfilePlannerRouteIsReachable() {
        openProfileFresh()
        let route = routeElement(
            identifier: "plan-motivation.open",
            labelPrefix: "Why I’m preparing"
        )
        scroll(route, intoViewWithin: element("profile.list"))
        XCTAssertTrue(route.isHittable, "The planner-motivation route is not reachable")
        route.tap()
        XCTAssertTrue(element("plan-motivation.view").waitForExistence(timeout: 10))
    }

    private func openSheetRoute(
        _ routeIdentifier: String,
        expected destinationIdentifier: String,
        screenshot: String
    ) {
        let route = element(routeIdentifier)
        scroll(route, intoViewWithin: element("profile.list"))
        XCTAssertTrue(route.isHittable, "Route \(routeIdentifier) is not reachable")
        route.tap()
        XCTAssertTrue(element(destinationIdentifier).waitForExistence(timeout: 10))
        attachScreenshot(screenshot)
    }

    private func openProfileFresh() {
        launchApp()
        tab("Profile").tap()
        XCTAssertTrue(element("profile.list").waitForExistence(timeout: 10))
    }

    private func openOfficialProviderGuide() {
        let profileList = element("profile.list")
        let route = routeElement(
            identifier: "official-setup.open",
            labelPrefix: "Official provider checks"
        )
        scroll(route, intoViewWithin: profileList)
        XCTAssertTrue(route.isHittable, "Official checks route is not reachable")
        route.tap()

        let guideList = element("official-setup.view")
        XCTAssertTrue(guideList.waitForExistence(timeout: 10))
        let apple = element("official-guide.apple")
        scroll(apple, intoViewWithin: guideList)
        XCTAssertTrue(apple.isHittable, "Apple official guide is not reachable")
        apple.tap()

        let detail = element("official-guide-detail.apple")
        XCTAssertTrue(detail.waitForExistence(timeout: 10))
        let officialLink = element("official-guide-link.apple.0")
        scroll(officialLink, intoViewWithin: detail)
        XCTAssertTrue(officialLink.isHittable, "Apple official link is not reachable")
        XCTAssertEqual(app.tabBars.count, 0, "Provider detail should hide the Tab Bar")
        attachScreenshot("official-guide-apple")

        tapFirstBackButton()
        XCTAssertTrue(guideList.waitForExistence(timeout: 5))
        tapFirstBackButton()
        XCTAssertTrue(profileList.waitForExistence(timeout: 5))
    }

    private func openPublicProfileRoute(
        _ routeIdentifier: String,
        expected destinationIdentifier: String,
        screenshot: String
    ) {
        let profileList = element("public-profile.list")
        let route = element(routeIdentifier)
        scroll(route, intoViewWithin: profileList)
        XCTAssertTrue(route.isHittable, "Route \(routeIdentifier) is not reachable")
        route.tap()
        XCTAssertTrue(element(destinationIdentifier).waitForExistence(timeout: 10))
        attachScreenshot(screenshot)
        tapFirstBackButton()
        XCTAssertTrue(profileList.waitForExistence(timeout: 5))
    }

    private func openPushRoute(
        _ routeIdentifier: String,
        labelPrefix: String,
        expected destinationIdentifier: String,
        screenshot: String
    ) {
        let profileList = element("profile.list")
        let route = routeElement(identifier: routeIdentifier, labelPrefix: labelPrefix)
        scroll(route, intoViewWithin: profileList)
        XCTAssertTrue(route.isHittable, "Route \(routeIdentifier) is not reachable")
        route.tap()
        XCTAssertTrue(element(destinationIdentifier).waitForExistence(timeout: 10))
        attachScreenshot(screenshot)
        tapFirstBackButton()
        XCTAssertTrue(profileList.waitForExistence(timeout: 5))
    }

    private func routeElement(identifier: String, labelPrefix: String) -> XCUIElement {
        let identifierMatch = element(identifier)
        if identifierMatch.exists {
            return identifierMatch
        }
        return app.descendants(matching: .any)
            .matching(NSPredicate(format: "label BEGINSWITH %@", labelPrefix))
            .firstMatch
    }

    private func assertNativeTabs(selected: String = "Overview", minimumTabHeight: CGFloat = 44) {
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10))
        XCTAssertEqual(tabBar.buttons.count, 3, "The shipping shell must expose exactly three native tabs")

        for label in ["Overview", "Matters", "Profile"] {
            let button = tab(label)
            XCTAssertTrue(button.exists, "Missing \(label) tab")
            assertMinimumTarget(button, label: "\(label) tab", minimumHeight: minimumTabHeight)
        }

        XCTAssertTrue(tab(selected).isSelected, "Expected \(selected) to be the selected tab")
    }

    private func assertMinimumTarget(
        _ target: XCUIElement,
        label: String,
        minimumHeight: CGFloat = 44
    ) {
        XCTAssertTrue(target.isHittable, "\(label) is not hittable")
        XCTAssertGreaterThanOrEqual(target.frame.width, 44, "\(label) is narrower than 44pt")
        XCTAssertGreaterThanOrEqual(
            target.frame.height,
            minimumHeight,
            "\(label) is shorter than the expected native control height"
        )
        XCTAssertTrue(target.frame.intersects(app.frame), "\(label) lies outside the app frame")
    }

    private func scroll(_ target: XCUIElement, intoViewWithin container: XCUIElement) {
        _ = container
        for _ in 0..<14 {
            if target.exists && target.isHittable && targetCenterClearsSystemChrome(target) {
                return
            }
            let safeTop = app.navigationBars.firstMatch.frame.maxY + 8
            let shouldScrollDown = target.exists && !target.frame.isEmpty && target.frame.maxY < safeTop
            let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: shouldScrollDown ? 0.42 : 0.72))
            let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: shouldScrollDown ? 0.70 : 0.48))
            start.press(forDuration: 0.05, thenDragTo: end)
        }
        attachScreenshot("unreachable-\(target.identifier)")
    }

    private func targetCenterClearsSystemChrome(_ target: XCUIElement) -> Bool {
        let navigationBar = app.navigationBars.firstMatch
        let tabBar = app.tabBars.firstMatch
        let safeTop = navigationBar.exists && navigationBar.isHittable
            ? navigationBar.frame.maxY + 8
            : app.frame.minY
        let safeBottom = tabBar.exists && tabBar.isHittable
            ? tabBar.frame.minY - 8
            : app.frame.maxY
        return target.frame.midY >= safeTop && target.frame.midY <= safeBottom
    }

    private func element(_ identifier: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: identifier).firstMatch
    }

    private func element(withIdentifierPrefix prefix: String) -> XCUIElement {
        app.descendants(matching: .any)
            .matching(NSPredicate(format: "identifier BEGINSWITH %@", prefix))
            .firstMatch
    }

    private func tab(_ label: String) -> XCUIElement {
        app.tabBars.buttons[label].firstMatch
    }

    private func tapNavigationButton(named name: String) {
        let button = app.navigationBars.buttons[name].firstMatch
        XCTAssertTrue(button.waitForExistence(timeout: 5), "Missing navigation button \(name)")
        button.tap()
    }

    private func tapFirstBackButton() {
        let navigationBar = app.navigationBars.firstMatch
        XCTAssertTrue(navigationBar.waitForExistence(timeout: 5))
        let backButton = navigationBar.buttons.element(boundBy: 0)
        XCTAssertTrue(backButton.exists, "Missing navigation back button")
        backButton.tap()
    }

    private func attachScreenshot(_ name: String) {
        // Allow native navigation chrome to finish its visual transition.
        Thread.sleep(forTimeInterval: 0.35)
        // Capture the screen directly: app.screenshot() can crop using portrait
        // coordinates after a landscape scene rotation on this runtime.
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        let deviceName = ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] ?? "iPhone-Simulator"
        attachment.name = "\(deviceName)-\(name)"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
