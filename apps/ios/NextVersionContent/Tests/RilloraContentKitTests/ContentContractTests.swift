import Foundation
import Testing
@testable import RilloraContentKit

let ownerID = "11111111-1111-4111-8111-111111111111"
let fileID = "22222222-2222-4222-8222-222222222222"
let packID = "33333333-3333-4333-8333-333333333333"
func fixtureAsset() -> ContentAsset {
    .init(publicId: fileID, kind: .file, mediaType: "application/pdf", byteCount: 8, version: 1, name: "合成资料", description: "", transcript: "", transcriptConfirmed: false, language: "zh-CN", state: "ready")
}
func fixtureWorkspace() -> ContentWorkspace {
    let copy = ContentNotice.Copy(title: "Synthetic", storage: "Synthetic", access: "Synthetic", retention: "Synthetic", voice: "Synthetic", limits: "Synthetic")
    return .init(canCreate: true, writesEnabled: true, acceptedNotice: true, notice: .init(version: "fixture-v1", en: copy, chinese: copy), assets: [], packs: [], received: [], receivedNextCursor: nil, cleanupPending: 0)
}
actor QueueTransport: ContentTransport {
    var requests: [ContentRequest] = []
    var responses: [ContentHTTPResponse]
    init(_ responses: [ContentHTTPResponse]) { self.responses = responses }
    func sendContent(_ request: ContentRequest) async throws -> ContentHTTPResponse {
        requests.append(request)
        guard !responses.isEmpty else { throw ContentError.unavailable }
        return responses.removeFirst()
    }
    func recorded() -> [ContentRequest] { requests }
}

@Test func explicitNullsMatchTheSharedAPISchema() throws {
    let task = ContentStep(title: "Synthetic step")
    let draft = ContentPackInput(body: .init(title: "Synthetic pack", tasks: [task]))
    let object = try #require(JSONSerialization.jsonObject(with: JSONEncoder().encode(draft)) as? [String: Any])
    #expect(object["personPublicId"] is NSNull)
    let body = try #require(object["body"] as? [String: Any]), steps = try #require(body["tasks"] as? [[String: Any]])
    #expect(steps[0]["matterPublicId"] is NSNull); #expect(steps[0]["providerId"] is NSNull)
}
@Test func circularDependenciesAndDanglingFileVersionsAreRejected() throws {
    var a = ContentStep(title: "First"), b = ContentStep(title: "Second")
    a.dependsOn = [b.id]; b.dependsOn = [a.id]
    #expect(throws: ContentError.cycle) { try ContentValidation.body(.init(title: "Pack", tasks: [a, b])) }
    #expect(throws: ContentError.invalidInput) { try ContentValidation.body(.init(title: "Pack", assetPublicIds: [fileID], assetVersions: [:])) }
    var body = ContentBody(title: "Pack", tasks: [a,b]); body.removeStep(a.id)
    #expect(body.tasks[0].dependsOn.isEmpty)
}
@Test func privateDraftIsTheDefaultAndCannotBePublished() async throws {
    let transport = QueueTransport([]), client = ContentClient(transport: transport, accountID: ownerID)
    #expect(ContentPackInput().intent == .after_death)
    let pack = ContentPack(publicId: packID, personPublicId: nil, intent: .after_death, version: 1, publicationId: nil, publishedVersion: nil, body: .init(title: "Pack"))
    await #expect(throws: ContentError.server("legacy_future_private")) { try await client.publish(pack) }
    #expect(await transport.recorded().isEmpty)
}
@Test func uploadFramingPreservesUTF8AndExactFileBytes() throws {
    let pdf = Data("%PDF-1.7".utf8), metadata = ContentMetadata(name: "合成资料.pdf", language: "zh-CN")
    let framed = try ContentBinary.upload(pdf, requestKey: fileID, kind: .file, metadata: metadata)
    let prefix = [UInt8](framed.prefix(4)), length = prefix.reduce(0) { ($0 << 8) | Int($1) }
    let header = try #require(JSONSerialization.jsonObject(with: framed.subdata(in: 4..<4+length)) as? [String: Any])
    #expect(header["mediaType"] as? String == "application/pdf")
    #expect((header["metadata"] as? [String: Any])?["name"] as? String == "合成资料.pdf")
    #expect(framed.suffix(pdf.count) == pdf)
}
@Test func uploadRejectsOversizeMetadataUnsupportedBytesAndVoiceDisguise() throws {
    #expect(throws: ContentError.unsupportedFile) { try ContentBinary.mediaType(Data("<svg>".utf8)) }
    #expect(throws: ContentError.tooLarge) { try ContentBinary.upload(Data("%PDF-1.7".utf8), requestKey: fileID, kind: .file, metadata: .init(name: "File", description: String(repeating: "中", count: 2000))) }
    #expect(throws: ContentError.unsupportedFile) { try ContentBinary.upload(Data("%PDF-1.7".utf8), requestKey: fileID, kind: .voice, metadata: .init(name: "Voice")) }
    #expect(throws: ContentError.invalidInput) { try ContentValidation.metadata(.init(name: "../private")) }
}
@Test func pcmWaveMatchesCanonicalServerFormatAndBounds() throws {
    let samples: [Int16] = [.min, -1, 0, 1, .max]
    let wave = try PCMRecording.wave(samples: samples)
    #expect(wave.count == 54); #expect(try PCMRecording.samples(from: wave) == samples)
    #expect(try ContentBinary.mediaType(wave) == "audio/wav")
    var changed = wave; changed[24] = 0
    #expect(throws: ContentError.unsupportedFile) { try PCMRecording.samples(from: changed) }
    #expect(throws: ContentError.tooLarge) { try PCMRecording.wave(samples: []) }
    #expect(throws: ContentError.tooLarge) { try PCMRecording.wave(samples: Array(repeating: 0, count: PCMRecording.maximumSamples + 1)) }
}
@Test func recorderChunksAreNormalizedButRemoteDownloadsMustBeCanonical() throws {
    let wave = try PCMRecording.wave(samples: [1,2,3])
    var extended = wave.prefix(36); extended.append(Data([74,85,78,75,2,0,0,0,0,0])); extended.append(wave.suffix(from: 36))
    let count = UInt32(extended.count - 8); for i in 0..<4 { extended[4+i] = UInt8((count >> (i*8)) & 255) }
    #expect(try PCMRecording.samples(from: extended, allowRecorderChunks: true) == [1,2,3])
    #expect(throws: ContentError.unsupportedFile) { try PCMRecording.samples(from: extended) }
}
@Test func downloadsRequireMatchingLengthMediaAndMagic() async throws {
    let pdf = Data("%PDF-1.7".utf8), asset = fixtureAsset()
    for response in [ContentHTTPResponse(status: 200, data: pdf, mediaType: "text/html", fileBytes: 8),
                     ContentHTTPResponse(status: 200, data: pdf, mediaType: "application/pdf", fileBytes: 7),
                     ContentHTTPResponse(status: 200, data: Data("bad-file".utf8), mediaType: "application/pdf", fileBytes: 8)] {
        let client = ContentClient(transport: QueueTransport([response]), accountID: ownerID)
        await #expect(throws: (any Error).self) { try await client.download(asset) }
    }
    let transport = QueueTransport([.init(status: 200, data: pdf, mediaType: "application/pdf", fileBytes: 8)])
    let client = ContentClient(transport: transport, accountID: ownerID)
    #expect(try await client.download(asset, publication: packID) == pdf)
    #expect(await transport.recorded().first?.path == "legacy-content/received/\(packID)/assets/\(fileID)/download")
    #expect(asset.downloadName == "合成资料.pdf")
}
@Test func publicationDoesNotAcceptUnconfirmedTextOrDifferentFileVersions() throws {
    let asset = fixtureAsset()
    let body = ContentBody(title: "Pack", assetPublicIds: [asset.id], assetVersions: [asset.id: 2])
    let publication = ContentPublication(publicId: packID, body: body, isOwner: false, ownerName: "Synthetic", publishedAt: "2026-10-23T00:00:00Z", assets: [asset], progress: [])
    #expect(throws: ContentError.invalidResponse) { try ContentValidation.publication(publication) }
}
@Test func selectedAccountAndVersionAreSentWithoutCredentials() async throws {
    let pack = ContentPack(publicId: packID, personPublicId: nil, intent: .after_death, version: 2, publicationId: nil, publishedVersion: nil, body: .init(title: "Updated"))
    let data = try JSONEncoder().encode(["pack":pack])
    let transport = QueueTransport([.init(status: 200, data: data)])
    let client = ContentClient(transport: transport, accountID: ownerID)
    let old = ContentPack(publicId: packID, personPublicId: nil, intent: .after_death, version: 1, publicationId: nil, publishedVersion: nil, body: .init(title: "Original"))
    #expect(try await client.save(pack.draft, previous: old).version == 2)
    let request = try #require(await transport.recorded().first)
    #expect(request.accountID == ownerID); #expect(request.method == "PATCH")
    let bytes = try #require(request.body)
    let object = try #require(JSONSerialization.jsonObject(with: bytes) as? [String: Any])
    #expect(object["expectedVersion"] as? Int == 1)
}
@Test @MainActor func failedRefreshDoesNotTurnConfirmedSaveIntoFailure() async throws {
    let transport = QueueTransport([]), store = ContentStore(client: .init(transport: transport, accountID: ownerID))
    let result = await store.perform { "server-confirmed" }
    #expect(result == "server-confirmed"); #expect(store.message == ContentText.get("savedRefresh"))
}
@Test @MainActor func authenticationFailureClearsCachedPrivateContent() async throws {
    let transport = QueueTransport([.init(status: 200, data: try JSONEncoder().encode(fixtureWorkspace())), .init(status: 401, data: Data())])
    let store = ContentStore(client: .init(transport: transport, accountID: ownerID))
    await store.reload(); #expect(store.workspace != nil)
    await store.reload(); #expect(store.workspace == nil); #expect(store.authenticationRequired)
}
actor DelayedTransport: ContentTransport {
    var continuation: CheckedContinuation<ContentHTTPResponse, Never>?
    func sendContent(_ request: ContentRequest) async throws -> ContentHTTPResponse {
        await withCheckedContinuation { continuation = $0 }
    }
    func ready() -> Bool { continuation != nil }
    func finish(_ response: ContentHTTPResponse) { continuation?.resume(returning: response); continuation = nil }
}
@Test @MainActor func clearedStoreRejectsLateReads() async throws {
    let transport = DelayedTransport(), store = ContentStore(client: .init(transport: transport, accountID: ownerID))
    let task = Task { await store.reload() }
    while !(await transport.ready()) { await Task.yield() }
    store.clear()
    await transport.finish(.init(status: 200, data: try JSONEncoder().encode(fixtureWorkspace())))
    await task.value
    #expect(store.workspace == nil); #expect(!store.loading)
}

@Test @MainActor func uncertainPublicationAccessHidesButRevocationClearsCachedContent() async throws {
    let value = ContentPublication(publicId: packID, body: .init(title: "Synthetic private text"), isOwner: false,
        ownerName: "Synthetic", publishedAt: "2026-10-23T00:00:00Z", assets: [], progress: [])
    let transport = QueueTransport([
        .init(status: 200, data: Data(#"{"revision":"1"}"#.utf8)),
        .init(status: 200, data: try JSONEncoder().encode(["publication": value])),
        .init(status: 503, data: Data(#"{"error":{"code":"temporarily_unavailable"}}"#.utf8)),
        .init(status: 404, data: Data(#"{"error":{"code":"legacy_unavailable"}}"#.utf8))
    ])
    let store = ContentPublicationStore(client: .init(transport: transport, accountID: ownerID), id: packID)
    await store.refresh(); #expect(store.verified); #expect(store.value != nil)
    store.hide(); #expect(!store.verified); #expect(store.value != nil)
    await store.refresh(); #expect(!store.verified); #expect(store.value != nil)
    await store.refresh(); #expect(!store.verified); #expect(store.value == nil)
}
