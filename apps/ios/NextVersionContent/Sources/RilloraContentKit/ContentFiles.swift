#if os(iOS)
import Foundation
import SwiftUI
import UniformTypeIdentifiers

enum ContentFileAccess {
    static func read(_ url: URL) async throws -> Data {
        let worker = Task.detached(priority: .userInitiated) {
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            var coordinationError: NSError?
            var result: Result<Data, Error> = .failure(ContentError.unavailable)
            NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordinationError) { coordinated in
                result = Result {
                    let file = try FileHandle(forReadingFrom: coordinated)
                    defer { try? file.close() }
                    var bytes = Data()
                    while bytes.count <= ContentLimits.fileBytes {
                        try Task.checkCancellation()
                        let chunk = try file.read(upToCount: min(65536, ContentLimits.fileBytes + 1 - bytes.count)) ?? Data()
                        if chunk.isEmpty { _ = try ContentBinary.mediaType(bytes); return bytes }
                        bytes.append(chunk)
                    }
                    throw ContentError.tooLarge
                }
            }
            if let coordinationError { throw coordinationError }
            return try result.get()
        }
        return try await withTaskCancellationHandler(operation: { try await worker.value }, onCancel: { worker.cancel() })
    }
}

struct ContentDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.data] }
    let bytes: Data
    init(bytes: Data) { self.bytes = bytes }
    init(configuration: ReadConfiguration) throws {
        guard let bytes = configuration.file.regularFileContents else { throw ContentError.unsupportedFile }
        self.bytes = bytes
    }
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper { FileWrapper(regularFileWithContents: bytes) }
}

/// Only the recorder/transcriber use temporary disk files. Exports use FileDocument.
@MainActor
final class ContentTemporaryFiles {
    private static var cleanedPreviousProcess = false
    private var directory: URL?
    init() {
        // Recover abandoned protected recordings after a process termination.
        // This runs once, before this process creates its first recording folder.
        if !Self.cleanedPreviousProcess {
            Self.cleanedPreviousProcess = true
            let root = FileManager.default.temporaryDirectory
            for url in (try? FileManager.default.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? []
                where url.lastPathComponent.hasPrefix("rillora-voice-") {
                try? FileManager.default.removeItem(at: url)
            }
        }
    }
    func create(_ name: String, bytes: Data? = nil) throws -> URL {
        if directory == nil {
            var folder = FileManager.default.temporaryDirectory.appendingPathComponent("rillora-voice-" + UUID().uuidString, isDirectory: true)
            try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true,
                attributes: [.protectionKey: FileProtectionType.complete, .posixPermissions: 0o700])
            var resource = URLResourceValues(); resource.isExcludedFromBackup = true
            try folder.setResourceValues(resource); directory = folder
        }
        let url = directory!.appendingPathComponent(name)
        if let bytes { try bytes.write(to: url, options: [.atomic, .completeFileProtection]) }
        return url
    }
    func remove() {
        if let directory { try? FileManager.default.removeItem(at: directory) }
        directory = nil
    }
    deinit { if let directory { try? FileManager.default.removeItem(at: directory) } }
}
#endif
