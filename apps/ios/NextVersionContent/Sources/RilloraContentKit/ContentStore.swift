import Foundation
import Observation

@MainActor @Observable
final class ContentStore {
    let client: ContentClient
    private(set) var workspace: ContentWorkspace?
    private(set) var loading = false
    private(set) var working = false
    private(set) var authenticationRequired = false
    var message: String?
    private var generation = 0
    private var loadRevision = 0
    init(client: ContentClient) { self.client = client }
    var canCreate: Bool { workspace.map { $0.canCreate && $0.writesEnabled && $0.acceptedNotice } ?? false }

    func reload() async {
        guard !working else { return }
        let epoch = generation
        loadRevision += 1; let revision = loadRevision; loading = true
        defer { if epoch == generation, revision == loadRevision { loading = false } }
        do {
            let value = try await client.overview()
            guard epoch == generation, revision == loadRevision, !Task.isCancelled else { return }
            workspace = value; message = nil; authenticationRequired = false
        } catch {
            guard epoch == generation, revision == loadRevision, !Task.isCancelled else { return }
            fail(error)
        }
    }
    func loadMore() async {
        guard let cursor = workspace?.receivedNextCursor, !working, !loading else { return }
        let epoch = generation; loading = true
        defer { if epoch == generation { loading = false } }
        do {
            let result = try await client.received(cursor: cursor)
            guard epoch == generation, !Task.isCancelled else { return }
            let previous = Set(workspace?.received.map(\.id) ?? [])
            guard result.next != cursor, result.items.allSatisfy({ !previous.contains($0.id) }) else { throw ContentError.invalidResponse }
            workspace?.received += result.items; workspace?.receivedNextCursor = result.next
        } catch { if epoch == generation, !Task.isCancelled { fail(error) } }
    }
    /// A confirmed write stays confirmed even if the follow-up refresh fails.
    func perform<T: Sendable>(_ operation: () async throws -> T) async -> T? {
        guard !working else { return nil }
        let epoch = generation; loadRevision += 1; loading = false; working = true; message = nil
        defer { if epoch == generation { working = false } }
        do {
            let result = try await operation()
            guard epoch == generation, !Task.isCancelled else { return nil }
            do {
                let value = try await client.overview()
                guard epoch == generation, !Task.isCancelled else { return nil }
                workspace = value
            } catch {
                guard epoch == generation, !Task.isCancelled else { return nil }
                if isAuthentication(error) { fail(error); return nil }
                message = ContentText.get("savedRefresh")
            }
            return result
        } catch {
            if epoch == generation, !Task.isCancelled { fail(error) }
            return nil
        }
    }
    func fail(_ error: Error) {
        if isAuthentication(error) { clear(); authenticationRequired = true }
        message = ContentText.error(error)
    }
    func clear() { generation += 1; loadRevision += 1; workspace = nil; loading = false; working = false; message = nil }
    private func isAuthentication(_ error: Error) -> Bool {
        (error as? ContentError) == .authentication || (error as? ContentError) == .accountChanged
    }
}

@MainActor @Observable
final class ContentPublicationStore {
    let client: ContentClient
    let id: String
    private(set) var value: ContentPublication?
    private(set) var verified = false
    private(set) var working = false
    var message: String?
    private var generation = 0
    private var revision: String?
    private var fetching = false
    init(client: ContentClient, id: String) { self.client = client; self.id = id }
    func refresh() async {
        guard !working, !fetching else { return }
        fetching = true; let epoch = generation
        defer { if epoch == generation { fetching = false } }
        do {
            let current = try await client.publicationRevision(id)
            let latest = revision == current && value != nil ? value! : try await client.publication(id)
            guard epoch == generation, !Task.isCancelled else { return }
            value = latest; revision = current; verified = true; message = nil
        } catch {
            guard epoch == generation, !Task.isCancelled else { return }
            // Hide on uncertain access without losing a progress draft on a
            // transient network failure. A definite revocation clears it.
            switch error as? ContentError {
            case .authentication, .accountChanged, .invalidResponse, .server("legacy_unavailable"):
                value = nil; revision = nil
            default: break
            }
            verified = false; message = ContentText.error(error)
        }
    }
    func report(_ input: ContentProgressInput, version: Int) async -> ContentProgress? {
        guard verified, !working, !fetching else { return nil }
        working = true; let epoch = generation
        defer { if epoch == generation { working = false } }
        do {
            let result = try await client.report(input, publication: id, version: version)
            guard epoch == generation, !Task.isCancelled else { return nil }
            // Keep the server-confirmed progress even when refreshing later fails.
            if let current = value {
                value = .init(publicId: current.publicId, body: current.body, isOwner: current.isOwner,
                              ownerName: current.ownerName, publishedAt: current.publishedAt, assets: current.assets,
                              progress: current.progress.filter { $0.taskId != input.taskId } + [result])
            }
            revision = nil; return result
        } catch { if epoch == generation, !Task.isCancelled { message = ContentText.error(error) }; return nil }
    }
    func hide() { generation += 1; verified = false; fetching = false; working = false }
    func clear() { hide(); value = nil; revision = nil; message = nil }
}
