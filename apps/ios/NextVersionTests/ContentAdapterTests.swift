import Foundation
import XCTest
import AVFoundation
@testable import Rillora
@testable import RilloraContentKit

final class ContentAdapterTests: XCTestCase {
    private let owner = "11111111-1111-4111-8111-111111111111"
    func testContentRequestsPinBearerAndAccountWithoutCookies() async throws {
        let token = VolatileSessionTokenStore(); try await token.save("synthetic-owner-session")
        let transport = ContentCaptureTransport()
        let client = APIClient(configuration: .init(baseURL: URL(string: "https://api.example.test/v1/")!, developmentPlannerID: nil), transport: transport, sessionTokenStore: token)
        _ = try await client.sendContent(.init(accountID: owner, path: "legacy-content/assets", method: "POST", body: Data([0,1,2]), binary: true))
        let captured = await transport.lastRequest()
        let request = try XCTUnwrap(captured)
        XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer synthetic-owner-session")
        XCTAssertEqual(request.value(forHTTPHeaderField: "x-rillora-planner"), owner)
        XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/octet-stream")
        XCTAssertFalse(request.httpShouldHandleCookies)
        XCTAssertEqual(request.url?.path, "/v1/legacy-content/assets")
    }
    func testLateResponseAfterLogoutIsRejected() async throws {
        let token = VolatileSessionTokenStore(); try await token.save("synthetic-owner-session")
        let transport = ContentCaptureTransport(onRequest: { try await token.delete() })
        let client = APIClient(configuration: .init(baseURL: URL(string: "https://api.example.test/v1/")!, developmentPlannerID: nil), transport: transport, sessionTokenStore: token)
        do { _ = try await client.sendContent(.init(accountID: owner, path: "legacy-content", method: "GET", body: nil, binary: false)); XCTFail("Late private response escaped") }
        catch { XCTAssertEqual(error as? ContentError, .accountChanged) }
    }
    func testMissingSessionDoesNotSendARequest() async throws {
        let transport = ContentCaptureTransport()
        let client = APIClient(configuration: .init(baseURL: URL(string: "https://api.example.test/v1/")!, developmentPlannerID: nil), transport: transport)
        do { _ = try await client.sendContent(.init(accountID: owner, path: "legacy-content", method: "GET", body: nil, binary: false)); XCTFail("Expected login") }
        catch { XCTAssertEqual(error as? ContentError, .authentication) }
        let captured = await transport.lastRequest()
        XCTAssertNil(captured)
    }
    func testBoundedNativeFileReadPreservesChineseDocumentAndRejectsOversize() async throws {
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        defer { try? FileManager.default.removeItem(at: directory) }
        let url = directory.appendingPathComponent("合成资料.pdf"), bytes = Data("%PDF-1.7\nSynthetic only".utf8)
        try bytes.write(to: url)
        let read = try await ContentFileAccess.read(url)
        XCTAssertEqual(read, bytes)
        try Data(repeating: 0, count: ContentLimits.fileBytes + 1).write(to: url)
        do { _ = try await ContentFileAccess.read(url); XCTFail("Expected size rejection") }
        catch { XCTAssertEqual(error as? ContentError, .tooLarge) }
    }
    @MainActor func testMicrophoneDenialKeepsNoAudioOrRecorder() async {
        let voice = ContentVoice(permission: { false })
        await voice.start()
        XCTAssertEqual(voice.phase, .failed); XCTAssertNil(voice.bytes)
        XCTAssertFalse(voice.transcribing); XCTAssertFalse(voice.playing)
        voice.clear(); XCTAssertEqual(voice.phase, .idle)
    }
    @MainActor func testLeavingDuringPermissionCannotStartALateRecording() async {
        var reply: CheckedContinuation<Bool, Never>?
        let voice = ContentVoice(permission: { await withCheckedContinuation { reply = $0 } })
        let task = Task { await voice.start() }
        while reply == nil { await Task.yield() }
        voice.clear(); reply?.resume(returning: true)
        await task.value
        XCTAssertEqual(voice.phase, .idle); XCTAssertNil(voice.bytes)
    }
    @MainActor func testTemporaryAudioIsExcludedFromBackupAndRemoved() throws {
        let files = ContentTemporaryFiles(), url = try files.create("synthetic.wav", bytes: Data([0, 1, 2]))
        // Simulator runs on the Mac filesystem and returns no data-protection class.
        // Never call this a hardware file-protection result.
        #if !targetEnvironment(simulator)
        let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
        XCTAssertEqual(attributes[.protectionKey] as? FileProtectionType, .complete)
        #endif
        let folder = url.deletingLastPathComponent()
        XCTAssertEqual(try folder.resourceValues(forKeys: [.isExcludedFromBackupKey]).isExcludedFromBackup, true)
        files.remove(); XCTAssertFalse(FileManager.default.fileExists(atPath: folder.path))
    }
    func testApplePCMWriterNormalizesIntoTheSharedUploadFormat() throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".wav")
        defer { try? FileManager.default.removeItem(at: url) }
        let expected: [Int16] = [0, 250, -250, .max, .min]
        try autoreleasepool {
            let format = try XCTUnwrap(AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: false))
            let buffer = try XCTUnwrap(AVAudioPCMBuffer(pcmFormat: format, frameCapacity: AVAudioFrameCount(expected.count)))
            buffer.frameLength = AVAudioFrameCount(expected.count)
            let channel = try XCTUnwrap(buffer.int16ChannelData?[0])
            for i in expected.indices { channel[i] = expected[i] }
            let file = try AVAudioFile(forWriting: url, settings: format.settings, commonFormat: .pcmFormatInt16, interleaved: false)
            try file.write(from: buffer)
        }
        let actual = try PCMRecording.samples(from: Data(contentsOf: url), allowRecorderChunks: true)
        XCTAssertEqual(actual, expected)
        let canonical = try PCMRecording.wave(samples: actual)
        XCTAssertEqual(canonical.count, 44 + expected.count * 2)
        XCTAssertEqual(try ContentBinary.mediaType(canonical), "audio/wav")
    }
    func testCancelledDocumentReadDoesNotReturnPrivateBytes() async throws {
        let url = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString + ".pdf")
        try Data(("%PDF-1.7" + String(repeating: "x", count: 100000)).utf8).write(to: url)
        defer { try? FileManager.default.removeItem(at: url) }
        let task = Task { try await ContentFileAccess.read(url) }; task.cancel()
        do { _ = try await task.value; XCTFail("Cancelled import returned bytes") }
        catch { XCTAssertTrue(error is CancellationError) }
    }
}

actor ContentCaptureTransport: HTTPTransport {
    private var request: URLRequest?
    let onRequest: @Sendable () async throws -> Void
    init(onRequest: @escaping @Sendable () async throws -> Void = {}) { self.onRequest = onRequest }
    func send(_ request: URLRequest) async throws -> HTTPTransportResponse {
        self.request = request; try await onRequest()
        return .init(data: Data("{}".utf8), response: HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!)
    }
    func lastRequest() -> URLRequest? { request }
}
