import Foundation
import XCTest
@testable import Rillora

@MainActor
final class SharedAccessStoreTests: XCTestCase {
    func testLateResponseCannotRestoreDetailsAfterBackgroundInvalidation() async {
        let service = DeferredSharedService()
        let store = SharedAccessStore(service: service)
        let first = Task { await store.refresh() }
        await service.waitForRequests(1)
        store.suspend()
        let second = Task { await store.refresh() }
        await service.waitForRequests(2)
        await service.finish(1, result: .success(envelope()))
        await second.value
        await service.finish(0, result: .success(envelope(includeItem: true)))
        await first.value
        XCTAssertEqual(store.data?.items.count, 0)
        XCTAssertFalse(store.isLoading)
        XCTAssertTrue(store.hasLoaded)
    }

    func testFailedRefreshDoesNotLeavePreviouslyGrantedContentVisible() async {
        let service = DeferredSharedService()
        let store = SharedAccessStore(service: service)
        let first = Task { await store.refresh() }
        await service.waitForRequests(1)
        await service.finish(0, result: .success(envelope(includeItem: true)))
        await first.value
        XCTAssertEqual(store.data?.items.count, 1)
        let refresh = Task { await store.refresh() }
        await service.waitForRequests(2)
        XCTAssertNil(store.data)
        await service.finish(1, result: .failure(RilloraAPIError.requestFailed("Offline")))
        await refresh.value
        XCTAssertNil(store.data)
        XCTAssertNotNil(store.error)
    }

    func testPeriodicRefreshAvoidsFlickerButClearsRevokedOrUnavailableContent() async {
        let service = DeferredSharedService()
        let store = SharedAccessStore(service: service)
        let first = Task { await store.refresh() }
        await service.waitForRequests(1)
        await service.finish(0, result: .success(envelope(includeItem: true)))
        await first.value
        let quiet = Task { await store.refresh(keepingVisible: true) }
        await service.waitForRequests(2)
        XCTAssertEqual(store.data?.items.count, 1)
        await service.finish(1, result: .success(envelope()))
        await quiet.value
        XCTAssertEqual(store.data?.items.count, 0)
        let failed = Task { await store.refresh(keepingVisible: true) }
        await service.waitForRequests(3)
        await service.finish(2, result: .failure(RilloraAPIError.requestFailed("Offline")))
        await failed.value
        XCTAssertNil(store.data)
        XCTAssertNotNil(store.error)
    }

    func testANameOnlyResponseWithPrivateDetailsFailsClosed() async {
        let service = DeferredSharedService()
        let store = SharedAccessStore(service: service)
        let task = Task { await store.refresh() }
        await service.waitForRequests(1)
        await service.finish(0, result: .success(envelope(includeItem: true, invalid: true)))
        await task.value
        XCTAssertNil(store.data)
        XCTAssertNotNil(store.error)
    }

    private func envelope(includeItem: Bool = false, invalid: Bool = false) -> SharedWithMeEnvelope {
        let connection = "11111111-1111-4111-8111-111111111111"
        return SharedWithMeEnvelope(connections: [IncomingSharingConnection(publicId: connection, ownerName: "Owner QA", acceptedAt: "2026-09-16T00:00:00Z", readOnly: true)],
            items: includeItem ? [SharedMatterItem(connectionPublicId: connection, ownerName: "Owner QA", matterPublicId: "22222222-2222-4222-8222-222222222222", detailLevel: invalid ? .name : .details,
                fields: ["title": "QA matter", "category": "document", "notes": "Previously granted details"])] : [], readOnly: true, purpose: "planner_directed")
    }
}

private actor DeferredSharedService: SharingServing {
    private var requests: [CheckedContinuation<SharedWithMeEnvelope, Error>?] = []
    private var waiters: [(Int, CheckedContinuation<Void, Never>)] = []
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope {
        try await withCheckedThrowingContinuation { continuation in
            requests.append(continuation)
            let ready = waiters.filter { $0.0 <= requests.count }
            waiters.removeAll { $0.0 <= requests.count }
            ready.forEach { $0.1.resume() }
        }
    }
    func waitForRequests(_ count: Int) async {
        if requests.count >= count { return }
        await withCheckedContinuation { waiters.append((count, $0)) }
    }
    func finish(_ index: Int, result: Result<SharedWithMeEnvelope, Error>) {
        requests[index]?.resume(with: result); requests[index] = nil
    }
    private var unexpected: RilloraAPIError { .requestFailed("Unexpected operation") }
    func fetchSharingConnections() async throws -> [SharingConnection] { throw unexpected }
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation { throw unexpected }
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation { throw unexpected }
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation { throw unexpected }
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation { throw unexpected }
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation { throw unexpected }
    func acceptSharingInvitation(token: String) async throws -> String { throw unexpected }
}
