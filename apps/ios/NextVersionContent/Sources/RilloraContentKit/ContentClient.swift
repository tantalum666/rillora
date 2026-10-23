import Foundation

public struct ContentRequest: Sendable {
    public let accountID: String
    public let path: String
    public let method: String
    public let body: Data?
    public let binary: Bool
}
public struct ContentHTTPResponse: Sendable {
    public let status: Int
    public let data: Data
    public let mediaType: String?
    public let fileBytes: Int?
    public init(status: Int, data: Data, mediaType: String? = nil, fileBytes: Int? = nil) {
        self.status = status; self.data = data; self.mediaType = mediaType; self.fileBytes = fileBytes
    }
}
public protocol ContentTransport: Sendable {
    func sendContent(_ request: ContentRequest) async throws -> ContentHTTPResponse
}

struct ContentClient: Sendable {
    let transport: any ContentTransport
    let accountID: String

    private func request(_ path: String, method: String = "GET", body: Data? = nil, binary: Bool = false) async throws -> ContentHTTPResponse {
        try ContentValidation.id(accountID); try Task.checkCancellation()
        let result = try await transport.sendContent(.init(accountID: accountID, path: "legacy-content" + path, method: method, body: body, binary: binary))
        try Task.checkCancellation()
        if result.status == 401 { throw ContentError.authentication }
        guard (200..<300).contains(result.status) else {
            struct Failure: Decodable { struct Detail: Decodable { let code: String }; let error: Detail }
            let code = (try? JSONDecoder().decode(Failure.self, from: result.data))?.error.code ?? "request_failed"
            if code == "account_changed" { throw ContentError.accountChanged }
            throw ContentError.server(code)
        }
        return result
    }
    private func json<T: Decodable>(_ path: String, method: String = "GET", body: Data? = nil, binary: Bool = false) async throws -> T {
        let result = try await request(path, method: method, body: body, binary: binary)
        guard result.data.count <= ContentLimits.jsonBytes else { throw ContentError.invalidResponse }
        do { return try JSONDecoder().decode(T.self, from: result.data) }
        catch { throw ContentError.invalidResponse }
    }
    func overview() async throws -> ContentWorkspace {
        let result: ContentWorkspace = try await json(""); try ContentValidation.workspace(result); return result
    }
    func received(cursor: String) async throws -> (items: [ContentReceived], next: String?) {
        try ContentValidation.id(cursor)
        struct Page: Decodable { let items: [ContentReceived]; let nextCursor: String? }
        let page: Page = try await json("/received?cursor=" + cursor)
        guard page.items.count <= 50 else { throw ContentError.invalidResponse }
        for item in page.items { try ContentValidation.id(item.id); try ContentValidation.body(item.body) }
        if let next = page.nextCursor { try ContentValidation.id(next) }
        return (page.items, page.nextCursor)
    }
    func consent(version: String) async throws {
        struct Input: Encodable { let version: String; let accepted = true }
        struct Result: Decodable { let accepted: Bool; let version: String }
        let result: Result = try await json("/consent", method: "POST", body: JSONEncoder().encode(Input(version: version)))
        guard result.accepted, result.version == version else { throw ContentError.invalidResponse }
    }
    func upload(_ bytes: Data, key: String, kind: ContentKind, metadata: ContentMetadata) async throws -> ContentAsset {
        struct Result: Decodable { let asset: ContentAsset }
        let result: Result = try await json("/assets", method: "POST", body: ContentBinary.upload(bytes, requestKey: key, kind: kind, metadata: metadata), binary: true)
        try ContentValidation.asset(result.asset); return result.asset
    }
    func update(_ asset: ContentAsset, metadata: ContentMetadata) async throws -> ContentAsset {
        try ContentValidation.asset(asset); try ContentValidation.metadata(metadata)
        struct Input: Encodable { let expectedVersion: Int; let metadata: ContentMetadata }
        struct Result: Decodable { let asset: ContentAsset }
        let result: Result = try await json("/assets/" + asset.id, method: "PATCH", body: JSONEncoder().encode(Input(expectedVersion: asset.version, metadata: metadata)))
        try ContentValidation.asset(result.asset)
        guard result.asset.id == asset.id, result.asset.version == asset.version + 1 else { throw ContentError.invalidResponse }
        return result.asset
    }
    func download(_ asset: ContentAsset, publication: String? = nil) async throws -> Data {
        try ContentValidation.asset(asset)
        if let publication { try ContentValidation.id(publication) }
        let path = publication.map { "/received/\($0)/assets/\(asset.id)/download" } ?? "/assets/\(asset.id)/download"
        let result = try await request(path)
        guard result.data.count == asset.byteCount, result.fileBytes == asset.byteCount,
              result.mediaType?.split(separator: ";").first.map(String.init) == asset.mediaType,
              try ContentBinary.mediaType(result.data) == asset.mediaType else { throw ContentError.invalidResponse }
        return result.data
    }
    func save(_ draft: ContentPackInput, previous: ContentPack?) async throws -> ContentPack {
        try ContentValidation.body(draft.body)
        if let person = draft.personPublicId { try ContentValidation.id(person) }
        if let previous { try ContentValidation.pack(previous) }
        var object = try JSONSerialization.jsonObject(with: JSONEncoder().encode(draft)) as! [String: Any]
        if let previous { object["expectedVersion"] = previous.version }
        struct Result: Decodable { let pack: ContentPack }
        let result: Result = try await json(previous.map { "/packs/" + $0.id } ?? "/packs", method: previous == nil ? "POST" : "PATCH", body: JSONSerialization.data(withJSONObject: object))
        try ContentValidation.pack(result.pack)
        guard previous.map({ result.pack.id == $0.id && result.pack.version == $0.version + 1 }) ?? (result.pack.version == 1) else { throw ContentError.invalidResponse }
        return result.pack
    }
    func download(_ asset: ContentAsset, from publication: ContentPublication) async throws -> Data {
        try await download(asset, publication: publication.isOwner ? nil : publication.publicId)
    }
    func publish(_ pack: ContentPack) async throws {
        try ContentValidation.pack(pack)
        guard pack.intent == .current, pack.personPublicId != nil else { throw ContentError.server("legacy_future_private") }
        struct Input: Encodable { let expectedVersion: Int; let shareNow = true }
        struct Result: Decodable { struct Publication: Decodable { let publicId: String }; let publication: Publication }
        let result: Result = try await json("/packs/\(pack.id)/publish", method: "POST", body: JSONEncoder().encode(Input(expectedVersion: pack.version)))
        try ContentValidation.id(result.publication.publicId)
    }
    func revoke(_ pack: ContentPack) async throws {
        try ContentValidation.id(pack.id)
        struct Result: Decodable { let revoked: Bool; let savedCopiesMayRemain: Bool }
        let result: Result = try await json("/packs/\(pack.id)/revoke", method: "POST", body: Data("{}".utf8))
        guard result.revoked, result.savedCopiesMayRemain else { throw ContentError.invalidResponse }
    }
    func remove(id: String, asset: Bool) async throws {
        try ContentValidation.id(id)
        struct Result: Decodable { let removed: Bool }
        let result: Result = try await json((asset ? "/assets/" : "/packs/") + id, method: "DELETE")
        guard result.removed else { throw ContentError.invalidResponse }
    }
    func publication(_ id: String) async throws -> ContentPublication {
        try ContentValidation.id(id)
        struct Result: Decodable { let publication: ContentPublication }
        let result: Result = try await json("/publications/" + id)
        try ContentValidation.publication(result.publication)
        guard result.publication.publicId == id else { throw ContentError.invalidResponse }
        return result.publication
    }
    func publicationRevision(_ id: String) async throws -> String {
        try ContentValidation.id(id)
        struct Result: Decodable { let revision: String }
        let result: Result = try await json("/publications/\(id)/state")
        guard result.revision.range(of: "^[0-9]{1,12}$", options: .regularExpression) != nil else { throw ContentError.invalidResponse }
        return result.revision
    }
    func report(_ input: ContentProgressInput, publication: String, version: Int) async throws -> ContentProgress {
        try ContentValidation.id(publication); try ContentValidation.id(input.taskId)
        try ContentValidation.text(input.reference, max: 240); try ContentValidation.text(input.note, max: 2000)
        guard version >= 0 else { throw ContentError.invalidInput }
        struct Input: Encodable { let expectedVersion: Int; let progress: ContentProgressInput }
        struct Result: Decodable { let progress: ContentProgress }
        let result: Result = try await json("/publications/\(publication)/progress", method: "POST", body: JSONEncoder().encode(Input(expectedVersion: version, progress: input)))
        guard result.progress.taskId == input.taskId, result.progress.version == version + 1 else { throw ContentError.invalidResponse }
        return result.progress
    }
}
