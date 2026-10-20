import XCTest

/// Only synthetic identities and the fixed disposable loopback API are used.
@MainActor
final class FutureNoticeUITests: XCTestCase {
    private let owner = "11111111-1111-4111-8111-111111111111"
    private let recipient = "22222222-2222-4222-8222-222222222222"
    private let base = "http://127.0.0.1:4396"
    override func setUp() { continueAfterFailure = false }
    func testEnglishOwnerAndRecipient() async throws { try await exercise(language: "en") }
    func testChineseOwnerAndRecipient() async throws { try await exercise(language: "zh-Hans") }

    private func exercise(language: String) async throws {
        let check = try await request("/qa/future-notice-fixture")
        XCTAssertEqual(check["fixture"] as? String, "future-notice-ui-v1")
        let contact = try await request("/v1/trusted-contacts", method: "POST", body: [
            "displayName": language == "en" ? "Synthetic family" : "合成家人", "relationshipLabel": "QA"
        ])["trustedContact"] as! [String: Any]
        let personID = try XCTUnwrap(contact["publicId"] as? String)
        let app = launch(language: language, planner: owner)
        defer { app.terminate() }
        let profile = app.tabBars.buttons[language == "en" ? "Profile" : "个人中心"]
        XCTAssertTrue(profile.waitForExistence(timeout: 15)); profile.tap()
        let contactButton = element(app, "contact.open.\(personID)")
        reveal(contactButton, in: app); contactButton.tap()
        let future = element(app, "future.open-owner")
        XCTAssertTrue(future.waitForExistence(timeout: 10)); future.tap()
        let email = app.textFields["future.email"]
        XCTAssertTrue(email.waitForExistence(timeout: 10))
        email.tap(); email.typeText("\(recipient)@example.test")
        let create = element(app, "future.create")
        reveal(create, in: app); create.tap()
        try require(element(app, "future.share"))
        capture("future-native-owner-\(language)")
        let revoke = element(app, "future.revoke")
        reveal(revoke, in: app); revoke.tap()
        XCTAssertTrue(app.staticTexts[language == "en" ? "Notice revoked" : "告知已撤销"].waitForExistence(timeout: 10))
        app.terminate()

        // Reuse the exact native-created contact. The invitation is produced by the real local API.
        let created = try await request("/v1/future-notices", method: "POST", body: [
            "personPublicId": personID, "email": "\(recipient)@example.test", "acknowledgedNoAccess": true
        ])
        let record = created["notice"] as! [String: Any]
        let id = try XCTUnwrap(record["publicId"] as? String)
        let localLink = try XCTUnwrap(URLComponents(string: created["invitationUrl"] as! String))
        let trustedLink = "https://app.rillora.xyz/future-invite#\(try XCTUnwrap(localLink.fragment))"
        let receiver = launch(language: language, planner: recipient, invitation: trustedLink)
        defer { receiver.terminate() }
        let acknowledge = element(receiver, "future.acknowledge")
        try require(acknowledge, timeout: 15)
        XCTAssertFalse(receiver.staticTexts["Never exposed private title"].exists)
        capture("future-native-recipient-\(language)")
        acknowledge.tap()
        XCTAssertTrue(element(receiver, "future.done").waitForExistence(timeout: 10))
        let received = try await request("/v1/future-notices/received", planner: recipient)["notices"] as! [[String: Any]]
        XCTAssertEqual(received.first?["publicId"] as? String, id)
        XCTAssertEqual(received.first?["contentAvailable"] as? Bool, false)
        let shared = try await request("/v1/sharing/shared-with-me", planner: recipient)
        XCTAssertEqual((shared["items"] as? [Any])?.count, 0)
        XCTAssertEqual((shared["connections"] as? [Any])?.count, 0)
        receiver.terminate()

        let inbox = launch(language: language, planner: recipient)
        defer { inbox.terminate() }
        let receiverProfile = inbox.tabBars.buttons[language == "en" ? "Profile" : "个人中心"]
        XCTAssertTrue(receiverProfile.waitForExistence(timeout: 15)); receiverProfile.tap()
        let sharedButton = element(inbox, "shared.open")
        reveal(sharedButton, in: inbox); sharedButton.tap()
        let leave = element(inbox, "future.leave.\(id)")
        try require(leave)
        capture("future-native-inbox-\(language)")
        leave.tap()
        XCTAssertTrue(inbox.staticTexts[language == "en" ? "No acknowledged arrangements" : "暂无已确认的身后安排"].waitForExistence(timeout: 10))
        let remaining = try await request("/v1/future-notices/received", planner: recipient)["notices"] as! [Any]
        XCTAssertTrue(remaining.isEmpty)
    }
    private func launch(language: String, planner: String, invitation: String? = nil) -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", language == "en" ? "en_US" : "zh_CN"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": base + "/v1", "RILLORA_DEV_PLANNER_ID": planner,
            "RILLORA_CUSTOMER_ACCESS_ENABLED": "true", "RILLORA_FUTURE_NOTICES_ENABLED": "true", "RILLORA_SERVICE_MARKET_CODE": "GLOBAL_US",
            "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1"]
        if let invitation { app.launchEnvironment["RILLORA_UI_TEST_FUTURE_INVITATION_URL"] = invitation }
        app.launch()
        return app
    }
    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil, planner: String? = nil) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: base + path)!)
        request.httpMethod = method
        request.setValue(planner ?? owner, forHTTPHeaderField: "x-dev-planner-id")
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, response) = try await URLSession.shared.data(for: request)
        let status = try XCTUnwrap(response as? HTTPURLResponse).statusCode
        XCTAssertTrue((200..<300).contains(status), "\(method) \(path) returned \(status)")
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }
    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement {
        app.descendants(matching: .any).matching(identifier: id).firstMatch
    }
    private func require(_ element: XCUIElement, timeout: TimeInterval = 10) throws {
        guard element.waitForExistence(timeout: timeout) else {
            capture("future-required-element-missing")
            throw NSError(domain: "FutureNoticeUITests", code: 1,
                          userInfo: [NSLocalizedDescriptionKey: "An expected arrangement control was absent. See the attached screen."])
        }
    }
    private func reveal(_ element: XCUIElement, in app: XCUIApplication) {
        for _ in 0..<8 { if element.isHittable { return }; app.swipeUp() }
        XCTAssertTrue(element.isHittable)
    }
    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
