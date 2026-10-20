import Foundation

enum BoundedDocumentReader {
    /// Metadata is only an early rejection hint. Read limit+1 bytes from the
    /// coordinated resource so a File Provider cannot bypass the memory bound.
    static func read(_ url: URL, maximumBytes: Int) async throws -> Data {
        try await Task.detached(priority: .userInitiated) {
            let access = url.startAccessingSecurityScopedResource()
            defer { if access { url.stopAccessingSecurityScopedResource() } }
            var coordinationError: NSError?
            var result: Result<Data, Error> = .failure(CocoaError(.fileReadUnknown))
            NSFileCoordinator().coordinate(readingItemAt: url, options: [], error: &coordinationError) { coordinatedURL in
                result = Result { try readBounded(coordinatedURL, maximumBytes: maximumBytes) }
            }
            if let coordinationError { throw coordinationError }
            return try result.get()
        }.value
    }

    static func readBounded(_ url: URL, maximumBytes: Int) throws -> Data {
        guard maximumBytes > 0, maximumBytes <= 2 * 1024 * 1024 else { throw CocoaError(.fileReadTooLarge) }
        let file = try FileHandle(forReadingFrom: url)
        defer { try? file.close() }
        var result = Data()
        while result.count <= maximumBytes {
            let chunk = try file.read(upToCount: min(64 * 1024, maximumBytes + 1 - result.count)) ?? Data()
            if chunk.isEmpty { return result }
            result.append(chunk)
        }
        throw RilloraAPIError.invalidPayload(String(localized: "The selected file is too large."))
    }
}
