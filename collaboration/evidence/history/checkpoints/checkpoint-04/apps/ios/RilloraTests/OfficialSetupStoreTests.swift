import XCTest
@testable import Rillora

@MainActor
final class OfficialSetupStoreTests: XCTestCase {
    func testReloadPublishesOfficialSetupChecks() async {
        let service = StubOfficialSetupService(fetch: .value([.officialFixture]))
        let store = OfficialSetupStore(service: service)

        await store.reload()

        XCTAssertEqual(store.state, .loaded([.officialFixture]))
        XCTAssertEqual(store.checks.first?.providerName, "Apple")
    }

    func testUpdateUsesOptimisticVersionAndAppliesSelfReport() async throws {
        let updated = OfficialSetupCheck.officialFixture(completed: true, version: 2)
        let service = StubOfficialSetupService(update: .value(updated))
        let store = OfficialSetupStore(service: service)
        await store.reload()

        let saved = await store.setCompleted(
            publicID: OfficialSetupCheck.officialFixture.publicId,
            completed: true
        )

        XCTAssertEqual(saved, updated)
        XCTAssertEqual(store.state, .loaded([updated]))
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first?.request)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.completed, true)
    }

    func testNoOpDoesNotWriteAnUnchangedSelfReport() async {
        let service = StubOfficialSetupService()
        let store = OfficialSetupStore(service: service)
        await store.reload()

        let saved = await store.setCompleted(
            publicID: OfficialSetupCheck.officialFixture.publicId,
            completed: false
        )

        XCTAssertNil(saved)
        let updates = await service.recordedUpdates()
        XCTAssertEqual(updates.count, 0)
    }

    func testConflictKeepsConfirmedServerStateAndOffersReload() async {
        let conflict = RilloraAPIError.server(
            status: 409,
            code: "version_conflict",
            message: "The record changed. Refresh and try again.",
            requestID: "request-3"
        )
        let service = StubOfficialSetupService(update: .failure(conflict))
        let store = OfficialSetupStore(service: service)
        await store.reload()

        let saved = await store.setCompleted(
            publicID: OfficialSetupCheck.officialFixture.publicId,
            completed: true
        )

        XCTAssertNil(saved)
        XCTAssertEqual(store.checks.first?.completed, false)
        XCTAssertTrue(store.pendingValues.isEmpty)
        XCTAssertEqual(
            store.mutationFailure,
            OfficialSetupMutationFailure(
                publicID: OfficialSetupCheck.officialFixture.publicId,
                message: "The record changed. Refresh and try again.",
                conflict: true
            )
        )
    }

    func testCancelledUpdateRollsBackOptimisticDisplayWithoutFailure() async {
        let service = StubOfficialSetupService(update: .cancelled)
        let store = OfficialSetupStore(service: service)
        await store.reload()

        let saved = await store.setCompleted(
            publicID: OfficialSetupCheck.officialFixture.publicId,
            completed: true
        )

        XCTAssertNil(saved)
        XCTAssertFalse(store.displayedCompleted(for: .officialFixture))
        XCTAssertTrue(store.pendingValues.isEmpty)
        XCTAssertNil(store.mutationFailure)
    }
}

private enum StubOfficialSetupResult<Value: Sendable>: Sendable {
    case value(Value)
    case failure(RilloraAPIError)
    case cancelled

    func get() throws -> Value {
        switch self {
        case .value(let value): value
        case .failure(let error): throw error
        case .cancelled: throw CancellationError()
        }
    }
}

private actor StubOfficialSetupService: OfficialSetupEditing {
    private let fetchResult: StubOfficialSetupResult<[OfficialSetupCheck]>
    private let updateResult: StubOfficialSetupResult<OfficialSetupCheck>
    private var updates: [(publicID: String, request: OfficialSetupCheckUpdateRequest)] = []

    init(
        fetch: StubOfficialSetupResult<[OfficialSetupCheck]> = .value([.officialFixture]),
        update: StubOfficialSetupResult<OfficialSetupCheck> = .value(.officialFixture)
    ) {
        fetchResult = fetch
        updateResult = update
    }

    func fetchOfficialSetupChecks() async throws -> [OfficialSetupCheck] {
        try fetchResult.get()
    }

    func updateOfficialSetupCheck(
        publicID: String,
        request: OfficialSetupCheckUpdateRequest
    ) async throws -> OfficialSetupCheck {
        updates.append((publicID, request))
        return try updateResult.get()
    }

    func recordedUpdates() -> [(publicID: String, request: OfficialSetupCheckUpdateRequest)] {
        updates
    }
}

private extension OfficialSetupCheck {
    static var officialFixture: OfficialSetupCheck {
        officialFixture(completed: false, version: 1)
    }

    static func officialFixture(completed: Bool, version: Int) -> OfficialSetupCheck {
        OfficialSetupCheck(
            publicId: "66666666-6666-4666-8666-666666666666",
            providerKey: "apple",
            policyVersion: "initial-2026-08-04",
            completed: completed,
            completedAt: completed ? "2026-08-09T00:00:00.000Z" : nil,
            version: version,
            updatedAt: "2026-08-09T00:00:00.000Z"
        )
    }
}
