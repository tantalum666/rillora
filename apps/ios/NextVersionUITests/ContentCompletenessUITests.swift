import XCTest

@MainActor
final class ContentCompletenessUITests: XCTestCase {
    override func setUp() { continueAfterFailure = false }
    func testEnglishOwnerDownloadAndSavedVoiceControls() async throws { try await exercise(language: "en") }
    func testChineseOwnerDownloadAndSavedVoiceControls() async throws { try await exercise(language: "zh-Hans") }

    private func exercise(language: String) async throws {
        let zh = language != "en", fixture = try await request("/qa/content-fixture")
        XCTAssertEqual(fixture["syntheticOnly"] as? Bool, true)
        XCTAssertEqual(fixture["fixture"] as? String, "native-content-v1")
        let workspace = try await request("/v1/legacy-content")
        let notice = try XCTUnwrap(workspace["notice"] as? [String: Any])
        _ = try await request("/v1/legacy-content/consent", method: "POST", body: ["version": try XCTUnwrap(notice["version"] as? String), "accepted": true])
        let filename = (zh ? "本人取回合成资料-" : "Synthetic owner retrieval-") + UUID().uuidString.prefix(8)
        let file = try await upload(Data("%PDF-1.7\nSynthetic owner export\n%%EOF".utf8), name: filename, voice: false)
        // Four synthetic PCM samples. No microphone, real speech or personal data.
        let wav = Data([82,73,70,70,44,0,0,0,87,65,86,69,102,109,116,32,16,0,0,0,1,0,1,0,128,62,0,0,0,125,0,0,2,0,16,0,100,97,116,97,8,0,0,0,0,0,1,0,255,255,0,0])
        let voice = try await upload(wav, name: zh ? "已保存的合成录音" : "Saved synthetic recording", voice: true)
        let fileID = try XCTUnwrap(file["publicId"] as? String), voiceID = try XCTUnwrap(voice["publicId"] as? String)
        let input: [String: Any] = ["personPublicId": try XCTUnwrap(fixture["person"] as? String), "intent": "current", "body": [
            "title": zh ? "本人取回合成办理包" : "Synthetic published owner pack", "note": "Synthetic only", "tasks": [],
            "assetPublicIds": [fileID], "assetVersions": [fileID: 1]]]
        let created = try await request("/v1/legacy-content/packs", method: "POST", body: input)
        let pack = try XCTUnwrap(created["pack"] as? [String: Any]), packID = try XCTUnwrap(pack["publicId"] as? String)
        _ = try await request("/v1/legacy-content/packs/\(packID)/publish", method: "POST", body: ["expectedVersion": 1, "shareNow": true])

        let app = XCUIApplication(); XCUIDevice.shared.orientation = .portrait
        app.launchArguments = ["-AppleLanguages", "(\(language))", "-AppleLocale", zh ? "zh_CN" : "en_US"]
        app.launchEnvironment = ["RILLORA_API_BASE_URL": "http://127.0.0.1:4397/v1", "RILLORA_DEV_PLANNER_ID": "11111111-1111-4111-8111-111111111111", "RILLORA_CUSTOMER_ACCESS_ENABLED": "true", "RILLORA_UI_TEST_FORCE_SIGNED_OUT": "1"]
        app.launch(); defer { app.terminate() }
        let profile = app.tabBars.buttons[zh ? "个人中心" : "Profile"]
        XCTAssertTrue(profile.waitForExistence(timeout: 20)); profile.tap()
        let open = element(app, "content.open"); reveal(open, app: app); open.tap()
        let published = element(app, "content.published.\(packID)"); reveal(published, app: app); published.tap()
        let download = element(app, "content.publication-download.\(fileID)")
        XCTAssertTrue(download.waitForExistence(timeout: 10)); reveal(download, app: app); download.tap()
        let picker = app.navigationBars["FullDocumentManagerViewControllerNavigationBar"]
        XCTAssertTrue(picker.buttons[zh ? "保存" : "Save"].waitForExistence(timeout: 8))
        capture(app, "owner-published-export-" + language)
        picker.buttons[zh ? "保存" : "Save"].tap()
        let returned = XCTNSPredicateExpectation(predicate: NSPredicate(format: "hittable == true"), object: download)
        XCTAssertEqual(XCTWaiter.wait(for: [returned], timeout: 8), .completed)
        app.navigationBars.buttons.element(boundBy: 0).tap()
        element(app, "content.sections").tap(); app.buttons[zh ? "文件与原声" : "Files & voice"].tap()
        let recording = element(app, "content.asset.\(voiceID)"); reveal(recording, app: app); recording.tap()
        let transcribe = element(app, "content.transcribe"), languagePicker = element(app, "content.recording-language")
        XCTAssertTrue(languagePicker.waitForExistence(timeout: 5)); reveal(languagePicker, app: app)
        languagePicker.tap(); app.buttons[zh ? "普通话" : "Mandarin Chinese"].tap()
        reveal(transcribe, app: app); XCTAssertTrue(transcribe.isEnabled)
        capture(app, "saved-voice-controls-" + language)
        // The personal Apple Speech authorization and recognition quality are separate gates.
        app.buttons[zh ? "关闭" : "Close"].firstMatch.tap()
        let discard = app.buttons[zh ? "放弃未保存的修改" : "Discard unsaved changes"]
        if discard.waitForExistence(timeout: 2) { discard.tap() }
        _ = try await request("/v1/legacy-content/packs/\(packID)", method: "DELETE")
        _ = try await request("/v1/legacy-content/assets/\(fileID)", method: "DELETE")
        _ = try await request("/v1/legacy-content/assets/\(voiceID)", method: "DELETE")
    }
    private func upload(_ data: Data, name: String, voice: Bool) async throws -> [String: Any] {
        let header = try JSONSerialization.data(withJSONObject: ["requestKey": UUID().uuidString.lowercased(), "kind": voice ? "voice" : "file",
            "mediaType": voice ? "audio/wav" : "application/pdf", "metadata": ["name": name, "language": "en-US"]])
        var count = UInt32(header.count).bigEndian
        var body = withUnsafeBytes(of: &count) { Data($0) }; body.append(header); body.append(data)
        var request = URLRequest(url: URL(string: "http://127.0.0.1:4397/v1/legacy-content/assets")!)
        request.httpMethod = "POST"; request.httpBody = body
        request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        request.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        let (response, status) = try await URLSession.shared.data(for: request)
        XCTAssertEqual((status as? HTTPURLResponse)?.statusCode, 201)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: response) as? [String: Any])
        return try XCTUnwrap(json["asset"] as? [String: Any])
    }
    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> [String: Any] {
        var request = URLRequest(url: URL(string: "http://127.0.0.1:4397" + path)!)
        request.httpMethod = method; request.setValue("11111111-1111-4111-8111-111111111111", forHTTPHeaderField: "x-dev-planner-id")
        if let body { request.httpBody = try JSONSerialization.data(withJSONObject: body); request.setValue("application/json", forHTTPHeaderField: "Content-Type") }
        let (data, status) = try await URLSession.shared.data(for: request)
        XCTAssertTrue((200..<300).contains((status as? HTTPURLResponse)?.statusCode ?? 0))
        return try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
    }
    private func element(_ app: XCUIApplication, _ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    private func reveal(_ item: XCUIElement, app: XCUIApplication) {
        for _ in 0..<10 { if item.exists && item.isHittable { return }; app.swipeUp() }
        XCTAssertTrue(item.exists && item.isHittable)
    }
    private func capture(_ app: XCUIApplication, _ name: String) {
        let shot = XCTAttachment(screenshot: app.screenshot()); shot.name = name; shot.lifetime = .keepAlways; add(shot)
    }
}
