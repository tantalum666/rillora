import XCTest

@MainActor
final class ContentNextUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testEnglishContentAndHealthEntry() throws { try exercise(language: "en") }
    func testChineseContentAndHealthEntry() throws { try exercise(language: "zh-Hans") }
    func testEnglishFilesVoiceAndSystemPickers() async throws { try await files(language: "en") }
    func testChineseFilesVoiceAndSystemPickers() async throws { try await files(language: "zh-Hans") }
    func testRecipientProgressAndRevocation() async throws {
        let fixture = try await request("/qa/content-fixture")
        let person = try XCTUnwrap(fixture["person"] as? String), recipient = try XCTUnwrap(fixture["recipient"] as? String)
        let workspace = try await request("/v1/legacy-content")
        let notice = try XCTUnwrap(workspace["notice"] as? [String: Any])
        _ = try await request("/v1/legacy-content/consent", method: "POST", body: ["version": try XCTUnwrap(notice["version"] as? String), "accepted": true])
        let step = UUID().uuidString.lowercased()
        let input: [String: Any] = ["personPublicId": person, "intent": "current", "body": [
            "title": "Synthetic received pack", "note": "No real family information", "assetPublicIds": [], "assetVersions": [:],
            "tasks": [["id": step, "title": "Synthetic recipient step", "action": "preserve", "instructions": "Synthetic only", "matterPublicId": NSNull(), "providerId": NSNull(), "dependsOn": []]]]]
        let savedPack = try await request("/v1/legacy-content/packs", method: "POST", body: input)
        let pack = try XCTUnwrap(savedPack["pack"] as? [String: Any])
        let id = try XCTUnwrap(pack["publicId"] as? String)
        let published = try await request("/v1/legacy-content/packs/\(id)/publish", method: "POST", body: ["expectedVersion": 1, "shareNow": true])
        let pub = try XCTUnwrap(published["publication"] as? [String: Any])
        let publication = try XCTUnwrap(pub["publicId"] as? String)
        let app = launch(language: "en", planner: recipient); defer { app.terminate() }
        openWorkspace(app, language: "en")
        element(app, "content.sections").tap(); app.buttons["Received packs"].tap()
        let received = element(app, "content.received.\(publication)"); XCTAssertTrue(received.waitForExistence(timeout: 10)); received.tap()
        let editor = element(app, "content.progress-editor.\(step)"); XCTAssertTrue(editor.waitForExistence(timeout: 8)); editor.tap()
        capture(app, "content-recipient-editor-en")
        let opened = XCTAttachment(string: app.debugDescription); opened.name = "content-recipient-editor-hierarchy"; opened.lifetime = .keepAlways; add(opened)
        let status = element(app, "content.progress-status.\(step)"); reveal(status, app: app); status.tap(); app.buttons["Ready"].tap()
        let save = element(app, "content.progress-save.\(step)"); reveal(save, app: app); save.tap()
        var confirmed = false
        for _ in 0..<20 {
            let response = try await request("/v1/legacy-content/publications/\(publication)")
            let details = response["publication"] as? [String: Any]
            confirmed = (details?["progress"] as? [[String: Any]])?.contains(where: { $0["taskId"] as? String == step && $0["status"] as? String == "ready" }) == true
            if confirmed { break }
            try await Task.sleep(for: .milliseconds(150))
        }
        XCTAssertTrue(confirmed, "Native UI progress must actually reach the API")
        capture(app, "content-recipient-progress-en")
        _ = try await request("/v1/legacy-content/packs/\(id)/revoke", method: "POST", body: [:])
        XCTAssertTrue(app.staticTexts["This content is no longer available."].waitForExistence(timeout: 25))
        let removed = XCTNSPredicateExpectation(predicate: NSPredicate(format: "exists == false"), object: app.staticTexts["Synthetic recipient step"])
        XCTAssertEqual(XCTWaiter.wait(for: [removed], timeout: 5), .completed)
        capture(app, "content-recipient-revoked-en")
    }
    private func files(language: String) async throws {
        let zh = language != "en"
        let name = (zh ? "原生合成文件-" : "Native synthetic file-") + UUID().uuidString.prefix(8)
        let workspace = try await request("/v1/legacy-content"), notice = try XCTUnwrap(workspace["notice"] as? [String: Any])
        _ = try await request("/v1/legacy-content/consent", method: "POST", body: ["version": try XCTUnwrap(notice["version"] as? String), "accepted": true])
        let header = try JSONSerialization.data(withJSONObject: ["requestKey": UUID().uuidString.lowercased(), "kind": "file", "mediaType": "application/pdf", "metadata": ["name": name, "language": zh ? "zh-CN" : "en-US"]])
        var length = UInt32(header.count).bigEndian
        var bytes = withUnsafeBytes(of: &length) { Data($0) }; bytes.append(header); bytes.append(Data("%PDF-1.7\nSynthetic only\n%%EOF".utf8))
        var upload = URLRequest(url: URL(string: "http://127.0.0.1:4397/v1/legacy-content/assets")!)
        upload.httpMethod = "POST"; upload.httpBody = bytes; upload.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        upload.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        let (uploaded, response) = try await URLSession.shared.data(for: upload)
        XCTAssertEqual((response as? HTTPURLResponse)?.statusCode, 201)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: uploaded) as? [String: Any])
        let asset = try XCTUnwrap(json["asset"] as? [String: Any]), id = try XCTUnwrap(asset["publicId"] as? String)
        let app = launch(language: language); defer { app.terminate() }
        openWorkspace(app, language: language)
        element(app, "content.sections").tap(); app.buttons[zh ? "文件与原声" : "Files & voice"].tap()
        let file = element(app, "content.asset.\(id)"); XCTAssertTrue(file.waitForExistence(timeout: 8)); file.tap()
        let description = element(app, "content.fileDescription")
        XCTAssertTrue(description.waitForExistence(timeout: 5)); description.tap(); description.typeText(zh ? "只用于原生界面验收" : "Native UI acceptance only")
        app.swipeUp(); let save = element(app, "content.save-file"); reveal(save, app: app); save.tap()
        XCTAssertTrue(file.waitForExistence(timeout: 8)); file.tap()
        capture(app, "content-file-\(language)")
        element(app, "content.download").tap()
        let saveCopy = app.navigationBars["FullDocumentManagerViewControllerNavigationBar"].buttons[zh ? "保存" : "Save"]
        XCTAssertTrue(saveCopy.waitForExistence(timeout: 8))
        capture(app, "content-export-\(language)")
        let hierarchy = XCTAttachment(string: app.debugDescription); hierarchy.name = "content-export-hierarchy-\(language)"; hierarchy.lifetime = .keepAlways; add(hierarchy)
        saveCopy.tap()
        let returned = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: element(app, "content.download"))
        XCTAssertEqual(XCTWaiter.wait(for: [returned], timeout: 8), .completed)
        app.buttons[zh ? "关闭" : "Close"].firstMatch.tap()
        element(app, "content.import-file").tap(); element(app, "content.choose-file").tap()
        capture(app, "content-import-picker-\(language)")
        let pickerHierarchy = XCTAttachment(string: app.debugDescription); pickerHierarchy.name = "content-import-hierarchy-\(language)"; pickerHierarchy.lifetime = .keepAlways; add(pickerHierarchy)
        let chosen = app.collectionViews.cells.matching(NSPredicate(format: "label CONTAINS %@", name)).firstMatch
        XCTAssertTrue(chosen.waitForExistence(timeout: 8)); chosen.tap()
        let importedSave = element(app, "content.save-file"); reveal(importedSave, app: app); XCTAssertTrue(importedSave.isEnabled); importedSave.tap()
        XCTAssertTrue(element(app, "content.record-voice").waitForExistence(timeout: 8))
        let updated = try await request("/v1/legacy-content")
        let imported = try XCTUnwrap((updated["assets"] as? [[String: Any]])?.first { $0["name"] as? String == name + ".pdf" })
        let importedID = try XCTUnwrap(imported["publicId"] as? String)
        var reread = URLRequest(url: URL(string: "http://127.0.0.1:4397/v1/legacy-content/assets/\(importedID)/download")!)
        reread.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        let (roundtrip, _) = try await URLSession.shared.data(for: reread)
        XCTAssertEqual(roundtrip, Data("%PDF-1.7\nSynthetic only\n%%EOF".utf8))
        element(app, "content.record-voice").tap()
        XCTAssertTrue(element(app, "content.start-recording").waitForExistence(timeout: 5))
        capture(app, "content-voice-\(language)")
        // Deliberately do not record ambient microphone audio in UI tests.
    }
    private func exercise(language: String) throws {
        let app = launch(language: language); defer { app.terminate() }
        let profile = app.tabBars.buttons[language == "en" ? "Profile" : "个人中心"]
        XCTAssertTrue(profile.waitForExistence(timeout: 20)); profile.tap()
        let entry = element(app, "content.open"); reveal(entry, app: app); entry.tap()
        XCTAssertTrue(element(app, "content.workspace").waitForExistence(timeout: 12))
        let notice = element(app, "content.review-notice")
        if notice.waitForExistence(timeout: 2) { notice.tap(); let ack = element(app, "content.acknowledge"); reveal(ack, app: app); ack.tap() }
        let create = element(app, "content.new-pack"); XCTAssertTrue(create.waitForExistence(timeout: 10)); create.tap()
        let title = app.textFields["content.packTitle"]
        XCTAssertTrue(title.waitForExistence(timeout: 5)); title.tap(); title.typeText(language == "en" ? "Native synthetic family pack" : "原生合成亲友办理包")
        app.swipeUp()
        let add = element(app, "content.add-step"); reveal(add, app: app); add.tap()
        let step = app.textFields["content.stepTitle"]; XCTAssertTrue(step.waitForExistence(timeout: 5)); step.tap(); step.typeText(language == "en" ? "Preserve selected documents" : "保留选定资料")
        app.swipeUp(); let saveStep = element(app, "content.save-step"); reveal(saveStep, app: app); saveStep.tap()
        let save = element(app, "content.save-pack"); reveal(save, app: app); save.tap()
        XCTAssertTrue(create.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts[language == "en" ? "Native synthetic family pack" : "原生合成亲友办理包"].waitForExistence(timeout: 5))
        capture(app, "content-pack-\(language)")
        app.navigationBars.buttons.element(boundBy: 0).tap()
        let health = element(app, "health-review.open"); reveal(health, app: app); health.tap()
        XCTAssertTrue(element(app, "health-review.view").waitForExistence(timeout: 5))
        XCTAssertTrue(element(app, "health-review.read").exists)
        capture(app, "health-entry-\(language)")
        // No HealthKit request or personal data is made by this navigation test.
    }
    private func launch(language: String, planner: String = "11111111-1111-4111-8111-111111111111") -> XCUIApplication {
        let app = XCUIApplication()
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", language == "en" ? "en_US" : "zh_CN"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": "http://127.0.0.1:4397/v1", "RILLORA_DEV_PLANNER_ID": planner,
                                 "RILLORA_CUSTOMER_ACCESS_ENABLED": "true", "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1"]
        app.launch(); return app
    }
    private func openWorkspace(_ app: XCUIApplication, language: String) {
        let profile = app.tabBars.buttons[language == "en" ? "Profile" : "个人中心"]
        XCTAssertTrue(profile.waitForExistence(timeout: 20)); profile.tap()
        let entry = element(app, "content.open"); reveal(entry, app: app); entry.tap()
        XCTAssertTrue(element(app, "content.workspace").waitForExistence(timeout: 12))
    }
    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "http://127.0.0.1:4397" + path)!)
        request.httpMethod = method; request.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, response) = try await URLSession.shared.data(for: request)
        XCTAssertTrue((200..<300).contains((response as? HTTPURLResponse)?.statusCode ?? 0))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }
    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    private func reveal(_ item: XCUIElement, app: XCUIApplication) {
        for _ in 0..<9 { if item.exists && item.isHittable { return }; app.swipeUp() }
        XCTAssertTrue(item.exists && item.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let attachment = XCTAttachment(screenshot: app.screenshot()); attachment.name = name; attachment.lifetime = .keepAlways; add(attachment)
    }
}
