import Foundation

enum ContentLimits {
    static let fileBytes = 8 * 1024 * 1024
    static let voiceSeconds = 180
    static let jsonBytes = 16 * 1024 * 1024
    static let savedTextBytes = 48 * 1024
    static let uploadMetadataBytes = 64 * 1024
}

public struct ContentChoice: Identifiable, Sendable, Equatable {
    public let id: String
    public let title: String
    public init(id: String, title: String) { self.id = id.lowercased(); self.title = title }
}

enum ContentKind: String, Codable, Sendable { case file, voice }
enum ContentIntent: String, Codable, CaseIterable, Sendable { case current, after_death }
enum ContentAction: String, Codable, CaseIterable, Sendable {
    case preserve, request_data, cancel_subscription, close_account, memorialize, other
}
enum ContentStatus: String, Codable, CaseIterable, Sendable {
    case not_started, ready, submitted, needs_information, completed, stopped
}

struct ContentMetadata: Codable, Sendable, Equatable {
    var name: String
    var description = ""
    var transcript = ""
    var transcriptConfirmed = false
    var language = "en-US"
    mutating func beginNewRecording(replacing: Bool) {
        if replacing { transcript = "" }
        transcriptConfirmed = false
    }
}

struct ContentAsset: Codable, Identifiable, Sendable, Equatable {
    let publicId: String
    let kind: ContentKind
    let mediaType: String
    let byteCount: Int
    let version: Int
    let name: String
    let description: String
    let transcript: String
    let transcriptConfirmed: Bool
    let language: String
    let state: String
    var id: String { publicId }
    var metadata: ContentMetadata {
        .init(name: name, description: description, transcript: transcript,
              transcriptConfirmed: transcriptConfirmed, language: language)
    }
    var downloadName: String {
        let extensions = ContentValidation.extensions[mediaType] ?? ["bin"]
        return extensions.contains(where: { name.lowercased().hasSuffix("." + $0) }) ? name : name + "." + extensions[0]
    }
}

struct ContentStep: Codable, Identifiable, Sendable, Equatable {
    var id = UUID().uuidString.lowercased()
    var matterPublicId: String?
    var title = ""
    var action: ContentAction = .preserve
    var instructions = ""
    var providerId: String?
    var dependsOn: [String] = []
}

struct ContentBody: Codable, Sendable, Equatable {
    var title = ""
    var note = ""
    var tasks: [ContentStep] = []
    var assetPublicIds: [String] = []
    var assetVersions: [String: Int] = [:]
    mutating func removeStep(_ id: String) {
        tasks.removeAll { $0.id == id }
        for i in tasks.indices { tasks[i].dependsOn.removeAll { $0 == id } }
    }
}

struct ContentPack: Codable, Identifiable, Sendable, Equatable {
    let publicId: String
    let personPublicId: String?
    let intent: ContentIntent
    let version: Int
    let publicationId: String?
    let publishedVersion: Int?
    let body: ContentBody
    var id: String { publicId }
    var draft: ContentPackInput { .init(personPublicId: personPublicId, intent: intent, body: body) }
}

struct ContentPackInput: Codable, Sendable, Equatable {
    var personPublicId: String?
    var intent: ContentIntent = .after_death
    var body = ContentBody()
    // JSONEncoder omits nil optionals; the shared API requires an explicit null.
    enum CodingKeys: CodingKey { case personPublicId, intent, body }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(personPublicId, forKey: .personPublicId)
        try c.encode(intent, forKey: .intent); try c.encode(body, forKey: .body)
    }
}

extension ContentStep {
    enum CodingKeys: CodingKey { case id, matterPublicId, title, action, instructions, providerId, dependsOn }
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id); try c.encode(matterPublicId, forKey: .matterPublicId)
        try c.encode(title, forKey: .title); try c.encode(action, forKey: .action)
        try c.encode(instructions, forKey: .instructions); try c.encode(providerId, forKey: .providerId)
        try c.encode(dependsOn, forKey: .dependsOn)
    }
}

struct ContentReceived: Codable, Identifiable, Sendable, Equatable {
    let publicId: String
    let ownerName: String?
    let publishedAt: String
    let body: ContentBody
    var id: String { publicId }
}
struct ContentProgressInput: Codable, Sendable, Equatable {
    var taskId: String
    var status: ContentStatus = .not_started
    var reference = ""
    var note = ""
}
struct ContentProgress: Codable, Sendable, Equatable {
    let publicId: String
    let version: Int
    let taskId: String
    let status: ContentStatus
    let reference: String
    let note: String
    let reportedByOwner: Bool
    var input: ContentProgressInput { .init(taskId: taskId, status: status, reference: reference, note: note) }
}
struct ContentPublication: Codable, Sendable, Equatable {
    let publicId: String
    let body: ContentBody
    let isOwner: Bool
    let ownerName: String?
    let publishedAt: String
    let assets: [ContentAsset]
    let progress: [ContentProgress]
}
struct ContentNotice: Codable, Sendable, Equatable {
    struct Copy: Codable, Sendable, Equatable {
        let title: String
        let storage: String
        let access: String
        let retention: String
        let voice: String
        let limits: String
    }
    let version: String
    let en: Copy
    let chinese: Copy
    enum CodingKeys: String, CodingKey { case version, en; case chinese = "zh-CN" }
}
struct ContentWorkspace: Codable, Sendable {
    let canCreate: Bool
    let writesEnabled: Bool
    let acceptedNotice: Bool
    let notice: ContentNotice
    var assets: [ContentAsset]
    var packs: [ContentPack]
    var received: [ContentReceived]
    var receivedNextCursor: String?
    let cleanupPending: Int
}

public enum ContentError: Error, Sendable, Equatable {
    case invalidResponse, invalidInput, tooLarge, unsupportedFile, cycle, accountChanged, authentication
    case server(String), unavailable, microphone, speechUnavailable
}

enum ContentValidation {
    static let extensions = ["application/pdf": ["pdf"], "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"],
                             "image/webp": ["webp"], "audio/wav": ["wav"]]
    static func id(_ value: String) throws {
        guard UUID(uuidString: value) != nil else { throw ContentError.invalidResponse }
    }
    static func text(_ value: String, max: Int, required: Bool = false) throws {
        guard value.utf16.count <= max, !required || !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw ContentError.invalidInput }
    }
    static func metadata(_ value: ContentMetadata) throws {
        try text(value.name, max: 160, required: true); try text(value.description, max: 2000)
        try text(value.transcript, max: 12000)
        guard !value.name.unicodeScalars.contains(where: { $0.value < 32 || $0.value == 127 || $0 == "/" || $0 == "\\" }),
              ["en-US", "zh-CN"].contains(value.language) else { throw ContentError.invalidInput }
        guard try JSONEncoder().encode(value).count <= ContentLimits.savedTextBytes else { throw ContentError.tooLarge }
    }
    static func asset(_ value: ContentAsset) throws {
        try id(value.id); try metadata(value.metadata)
        guard (1...ContentLimits.fileBytes).contains(value.byteCount), value.version > 0,
              extensions[value.mediaType] != nil, ["ready", "uploading"].contains(value.state),
              (value.kind == .voice) == (value.mediaType == "audio/wav") else { throw ContentError.invalidResponse }
    }
    static func body(_ value: ContentBody) throws {
        try text(value.title, max: 180, required: true); try text(value.note, max: 3000)
        let ids = Set(value.tasks.map(\.id)), selected = Set(value.assetPublicIds)
        guard value.tasks.count <= 30, ids.count == value.tasks.count, selected.count == value.assetPublicIds.count,
              selected.count <= 20, Set(value.assetVersions.keys) == selected,
              value.assetVersions.values.allSatisfy({ $0 > 0 }) else { throw ContentError.invalidInput }
        for a in selected { try id(a) }
        for task in value.tasks {
            try id(task.id); try text(task.title, max: 180, required: true); try text(task.instructions, max: 2500)
            if let matter = task.matterPublicId { try id(matter) }
            if let provider = task.providerId, provider.range(of: "^[a-z0-9-]{1,50}$", options: .regularExpression) == nil { throw ContentError.invalidInput }
            guard task.dependsOn.count <= 10, task.dependsOn.allSatisfy({ ids.contains($0) && $0 != task.id }) else { throw ContentError.invalidInput }
        }
        let tasks = Dictionary(uniqueKeysWithValues: value.tasks.map { ($0.id, $0.dependsOn) })
        var visited = Set<String>(), active = Set<String>()
        func visit(_ id: String) throws {
            if active.contains(id) { throw ContentError.cycle }
            if visited.contains(id) { return }
            active.insert(id)
            for previous in tasks[id] ?? [] { try visit(previous) }
            active.remove(id); visited.insert(id)
        }
        for task in value.tasks { try visit(task.id) }
        guard try JSONEncoder().encode(value).count <= ContentLimits.savedTextBytes else { throw ContentError.tooLarge }
    }
    static func pack(_ value: ContentPack) throws {
        try id(value.id); try body(value.body)
        if let person = value.personPublicId { try id(person) }
        if let pub = value.publicationId { try id(pub) }
        guard value.version > 0, (value.publicationId == nil) == (value.publishedVersion == nil),
              value.publishedVersion.map({ $0 > 0 && $0 <= value.version }) ?? true else { throw ContentError.invalidResponse }
    }
    static func workspace(_ value: ContentWorkspace) throws {
        guard value.assets.count <= 100, value.packs.count <= 30, value.received.count <= 50,
              value.notice.version.utf8.count <= 80, !value.notice.version.isEmpty, value.cleanupPending >= 0 else { throw ContentError.invalidResponse }
        for a in value.assets { try asset(a) }; for p in value.packs { try pack(p) }
        for r in value.received { try id(r.id); try body(r.body) }
        if let cursor = value.receivedNextCursor { try id(cursor) }
    }
    static func publication(_ value: ContentPublication) throws {
        try id(value.publicId); try body(value.body)
        guard value.assets.count <= 20, value.progress.count <= 30,
              Set(value.assets.map(\.id)) == Set(value.body.assetPublicIds),
              Set(value.progress.map(\.taskId)).count == value.progress.count else { throw ContentError.invalidResponse }
        for a in value.assets {
            try asset(a)
            guard a.version == value.body.assetVersions[a.id], a.transcriptConfirmed || a.transcript.isEmpty else { throw ContentError.invalidResponse }
        }
        for p in value.progress {
            try id(p.publicId); try id(p.taskId); try text(p.reference, max: 240); try text(p.note, max: 2000)
            guard p.version > 0, value.body.tasks.contains(where: { $0.id == p.taskId }) else { throw ContentError.invalidResponse }
        }
    }
}
