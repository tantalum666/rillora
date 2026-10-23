import Foundation
import XCTest
@testable import Rillora
@testable import RilloraContentKit

final class ContentLocalIntegrationTests: XCTestCase {
    private let base = URL(string: "http://127.0.0.1:4397")!
    func testNativeFileVoicePackRecipientProgressRevocationAndExpiredRetrieval() async throws {
        let (data, _) = try await URLSession.shared.data(from: base.appendingPathComponent("qa/content-fixture"))
        let fixture = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(fixture["fixture"] as? String, "native-content-v1")
        guard fixture["syntheticOnly"] as? Bool == true else { XCTFail("Wrong fixture"); return }
        let owner = try client(XCTUnwrap(fixture["owner"] as? String))
        let recipient = try client(XCTUnwrap(fixture["recipient"] as? String))
        let person = try XCTUnwrap(fixture["person"] as? String)
        addTeardownBlock { [base] in
            var request = URLRequest(url: base.appendingPathComponent("qa/family/enabled")); request.httpMethod = "POST"
            _ = try await URLSession.shared.data(for: request)
        }
        let overview = try await owner.overview()
        try await owner.consent(version: overview.notice.version)
        let pdf = Data("%PDF-1.7\nNative synthetic document only.\n%%EOF".utf8), key = UUID().uuidString.lowercased()
        let file = try await owner.upload(pdf, key: key, kind: .file, metadata: .init(name: "原生合成资料", language: "zh-CN"))
        let retried = try await owner.upload(pdf, key: key, kind: .file, metadata: file.metadata)
        XCTAssertEqual(file.id, retried.id)
        let downloaded = try await owner.download(file)
        XCTAssertEqual(downloaded, pdf); XCTAssertEqual(file.downloadName, "原生合成资料.pdf")
        let wav = try PCMRecording.wave(samples: [0,100,-100,0])
        let voice = try await owner.upload(wav, key: UUID().uuidString.lowercased(), kind: .voice,
            metadata: .init(name: "Synthetic voice", transcript: "Unconfirmed draft", transcriptConfirmed: false))
        let first = ContentStep(title: "Preserve selected copies")
        let second = ContentStep(title: "Submit through official channel", action: .request_data, providerId: "apple", dependsOn: [first.id])
        let body = ContentBody(title: "Native cross-client synthetic pack", tasks: [first, second],
                               assetPublicIds: [file.id, voice.id], assetVersions: [file.id: file.version, voice.id: voice.version])
        let privatePack = try await owner.save(.init(personPublicId: person, body: body), previous: nil)
        do { try await owner.publish(privatePack); XCTFail("Future draft must stay private") }
        catch { XCTAssertEqual(error as? ContentError, .server("legacy_future_private")) }
        let current = try await owner.save(.init(personPublicId: person, intent: .current, body: body), previous: privatePack)
        try await owner.publish(current)
        let after = try await owner.overview()
        let publication = try XCTUnwrap(after.packs.first { $0.id == current.id }?.publicationId)
        let received = try await recipient.publication(publication)
        XCTAssertFalse(received.isOwner)
        XCTAssertEqual(received.body.tasks[1].dependsOn, [first.id])
        XCTAssertTrue(try XCTUnwrap(received.assets.first { $0.id == voice.id }).transcript.isEmpty)
        let recipientBytes = try await recipient.download(file, publication: publication)
        XCTAssertEqual(recipientBytes, pdf)
        do { _ = try await recipient.report(.init(taskId: second.id, status: .completed), publication: publication, version: 0); XCTFail("Skipped prerequisite") }
        catch { XCTAssertEqual(error as? ContentError, .server("legacy_prerequisites")) }
        _ = try await recipient.report(.init(taskId: first.id, status: .completed, reference: "synthetic-receipt"), publication: publication, version: 0)
        _ = try await recipient.report(.init(taskId: second.id, status: .submitted), publication: publication, version: 0)
        let progress = try await owner.publication(publication)
        XCTAssertEqual(progress.progress.count, 2)
        let changedVoice = try await owner.update(voice, metadata: .init(name: "Updated voice", transcript: "Owner confirmed text", transcriptConfirmed: true))
        XCTAssertEqual(changedVoice.version, 2)
        let frozen = try await recipient.publication(publication)
        XCTAssertEqual(frozen.assets.first { $0.id == voice.id }?.version, 1)
        XCTAssertTrue(frozen.assets.first { $0.id == voice.id }?.transcript.isEmpty == true)
        var updatedBody = body; updatedBody.assetVersions[voice.id] = changedVoice.version
        let future = try await owner.save(.init(personPublicId: person, intent: .after_death, body: updatedBody), previous: current)
        let changedIntent = try await owner.overview()
        XCTAssertNil(changedIntent.packs.first { $0.id == current.id }?.publicationId)
        do { _ = try await recipient.publication(publication); XCTFail("Changing intent must revoke the earlier share") }
        catch { XCTAssertEqual(error as? ContentError, .server("legacy_unavailable")) }
        let replacement = try await owner.save(.init(personPublicId: person, intent: .current, body: updatedBody), previous: future)
        try await owner.publish(replacement)
        let replacementWorkspace = try await owner.overview()
        let replacementID = try XCTUnwrap(replacementWorkspace.packs.first { $0.id == replacement.id }?.publicationId)
        XCTAssertNotEqual(replacementID, publication)
        let freshCopy = try await recipient.publication(replacementID)
        XCTAssertEqual(freshCopy.assets.first { $0.id == voice.id }?.transcript, "Owner confirmed text")
        try await owner.revoke(replacement)
        do { _ = try await recipient.download(file, publication: replacementID); XCTFail("Revoked access survived") }
        catch { XCTAssertEqual(error as? ContentError, .server("legacy_unavailable")) }
        var expire = URLRequest(url: base.appendingPathComponent("qa/family/expired")); expire.httpMethod = "POST"
        let (_, expiryResponse) = try await URLSession.shared.data(for: expire)
        XCTAssertEqual((expiryResponse as? HTTPURLResponse)?.statusCode, 200, "Fixture must actually expire its synthetic grants")
        let expired = try await owner.overview(); XCTAssertFalse(expired.canCreate)
        let retained = try await owner.download(file); XCTAssertEqual(retained, pdf)
        try await owner.remove(id: current.id, asset: false)
        try await owner.remove(id: file.id, asset: true); try await owner.remove(id: voice.id, asset: true)
    }
    private func client(_ id: String) -> ContentClient {
        .init(transport: APIClient(configuration: .init(baseURL: base.appendingPathComponent("v1"), developmentPlannerID: id)), accountID: id)
    }
}
