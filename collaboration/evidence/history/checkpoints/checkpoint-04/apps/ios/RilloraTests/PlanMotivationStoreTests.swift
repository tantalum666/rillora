import XCTest
@testable import Rillora

@MainActor
final class PlanMotivationStoreTests: XCTestCase {
    func testLoadLatestAppliesServerMotivationAndVersion() async {
        let latest = Plan.motivationFixture(
            motivation: .crossBorder,
            version: 4
        )
        let service = StubPlanService(fetch: .value(latest))
        let store = PlanMotivationStore(plan: .motivationFixture, service: service)

        await store.loadLatestIfNeeded()

        XCTAssertEqual(store.source, latest)
        XCTAssertEqual(store.selection, .crossBorder)
        XCTAssertEqual(store.state, .ready)
    }

    func testSaveUsesLatestVersionAndAppliesResponse() async throws {
        let updated = Plan.motivationFixture(
            motivation: .generalPreparedness,
            version: 2
        )
        let service = StubPlanService(update: .value(updated))
        let store = PlanMotivationStore(plan: .motivationFixture, service: service)
        store.selection = .generalPreparedness
        XCTAssertTrue(store.hasUnsavedChanges)

        let saved = await store.save()

        XCTAssertEqual(saved, updated)
        XCTAssertEqual(store.source, updated)
        XCTAssertFalse(store.hasUnsavedChanges)
        let requests = await service.recordedUpdates()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.motivation, .generalPreparedness)
    }

    func testConflictKeepsSelectedMotivationForRecovery() async {
        let conflict = RilloraAPIError.server(
            status: 409,
            code: "version_conflict",
            message: "The plan changed. Refresh and try again.",
            requestID: "request-4"
        )
        let service = StubPlanService(update: .failure(conflict))
        let store = PlanMotivationStore(plan: .motivationFixture, service: service)
        store.selection = .familyResponsibility

        let saved = await store.save()

        XCTAssertNil(saved)
        XCTAssertEqual(store.selection, .familyResponsibility)
        XCTAssertTrue(store.hasUnsavedChanges)
        XCTAssertEqual(
            store.state,
            .failed(message: "The plan changed. Refresh and try again.", conflict: true)
        )
    }

    func testCancelledSaveReturnsToReadyWithoutChangingSource() async {
        let service = StubPlanService(update: .cancelled)
        let store = PlanMotivationStore(plan: .motivationFixture, service: service)
        store.selection = .lifeChange

        let saved = await store.save()

        XCTAssertNil(saved)
        XCTAssertEqual(store.source, .motivationFixture)
        XCTAssertEqual(store.selection, .lifeChange)
        XCTAssertEqual(store.state, .ready)
    }

    func testCancelledLatestLoadRestoresReadyState() async {
        let service = StubPlanService(fetch: .cancelled)
        let store = PlanMotivationStore(plan: .motivationFixture, service: service)

        await store.loadLatestIfNeeded()

        XCTAssertEqual(store.state, .ready)
        XCTAssertEqual(store.source, .motivationFixture)
    }
}

private enum StubPlanResult<Value: Sendable>: Sendable {
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

private actor StubPlanService: PlanEditing {
    private let fetchResult: StubPlanResult<Plan>
    private let updateResult: StubPlanResult<Plan>
    private var updates: [PlanUpdateRequest] = []

    init(
        fetch: StubPlanResult<Plan> = .value(.motivationFixture),
        update: StubPlanResult<Plan> = .value(.motivationFixture)
    ) {
        fetchResult = fetch
        updateResult = update
    }

    func fetchPlan() async throws -> Plan {
        try fetchResult.get()
    }

    func updatePlan(request: PlanUpdateRequest) async throws -> Plan {
        updates.append(request)
        return try updateResult.get()
    }

    func recordedUpdates() -> [PlanUpdateRequest] {
        updates
    }
}

private extension Plan {
    static var motivationFixture: Plan {
        motivationFixture(motivation: .complexDigitalLife, version: 1)
    }

    static func motivationFixture(motivation: PlanMotivation, version: Int) -> Plan {
        Plan(
            publicId: "22222222-2222-4222-8222-222222222222",
            motivation: motivation.rawValue,
            status: "active",
            firstUseState: .completed,
            firstUseStep: 2,
            policyVersion: "mvp-2026-08-04",
            lastReviewedAt: nil,
            reviewDueAt: nil,
            version: version,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-09T00:00:00.000Z"
        )
    }
}
