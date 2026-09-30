import XCTest
@testable import Rillora

@MainActor
final class FirstUseGuideStoreTests: XCTestCase {
    func testStartRecordsInProgressStepOneWithoutChangingReadiness() async throws {
        let service = FirstUsePlanService(responses: [
            .fixture(state: .guideInProgress, step: 1, version: 2),
        ])
        let store = FirstUseGuideStore(
            plan: .fixture(state: .available, step: 0, version: 1),
            service: service
        )

        let saved = await store.startIfNeeded()

        XCTAssertEqual(saved?.firstUseState, .guideInProgress)
        XCTAssertEqual(store.step, 1)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.firstUseState, .guideInProgress)
        XCTAssertEqual(request.firstUseStep, 1)
        XCTAssertNil(request.motivation)
    }

    func testOptionalMotivationAdvancesToMatterStep() async throws {
        let service = FirstUsePlanService(responses: [
            .fixture(state: .guideInProgress, step: 2, version: 4, motivation: .generalPreparedness),
        ])
        let store = FirstUseGuideStore(
            plan: .fixture(state: .guideInProgress, step: 1, version: 3),
            service: service
        )
        store.motivation = .generalPreparedness

        _ = await store.continueToMatter()

        XCTAssertEqual(store.step, 2)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first)
        XCTAssertEqual(request.expectedVersion, 3)
        XCTAssertEqual(request.motivation, .generalPreparedness)
        XCTAssertEqual(request.firstUseState, .guideInProgress)
        XCTAssertEqual(request.firstUseStep, 2)
    }

    func testPausedGuideRemainsReachableAndResumesItsSavedStep() async throws {
        XCTAssertTrue(FirstUseState.guidePaused.showsStarter)
        XCTAssertFalse(FirstUseState.completed.showsStarter)
        let service = FirstUsePlanService(responses: [.fixture(state: .guideInProgress, step: 2, version: 6)])
        let store = FirstUseGuideStore(plan: .fixture(state: .guidePaused, step: 2, version: 5), service: service)
        _ = await store.startIfNeeded()
        XCTAssertEqual(store.step, 2)
        let updates = await service.recordedUpdates()
        XCTAssertEqual(updates.first?.firstUseStep, 2)
        XCTAssertEqual(updates.first?.expectedVersion, 5)
        XCTAssertNil(updates.first?.motivation)
    }

    func testSaveAndExitPersistsPausedStep() async throws {
        let service = FirstUsePlanService(responses: [
            .fixture(state: .guidePaused, step: 2, version: 5),
        ])
        let store = FirstUseGuideStore(
            plan: .fixture(state: .guideInProgress, step: 2, version: 4),
            service: service
        )

        let saved = await store.pause()

        XCTAssertEqual(saved?.firstUseState, .guidePaused)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first)
        XCTAssertEqual(request.firstUseState, .guidePaused)
        XCTAssertEqual(request.firstUseStep, 2)
    }
}

private actor FirstUsePlanService: PlanEditing {
    private var responses: [Plan]
    private var updates: [PlanUpdateRequest] = []

    init(responses: [Plan]) {
        self.responses = responses
    }

    func fetchPlan() async throws -> Plan {
        responses.first ?? .fixture(state: .available, step: 0, version: 1)
    }

    func updatePlan(request: PlanUpdateRequest) async throws -> Plan {
        updates.append(request)
        guard !responses.isEmpty else {
            throw RilloraAPIError.requestFailed("Missing test response")
        }
        return responses.removeFirst()
    }

    func recordedUpdates() -> [PlanUpdateRequest] { updates }
}

private extension Plan {
    static func fixture(
        state: FirstUseState,
        step: Int,
        version: Int,
        motivation: PlanMotivation? = nil
    ) -> Plan {
        Plan(
            publicId: "22222222-2222-4222-8222-222222222222",
            motivation: motivation?.rawValue,
            status: "active",
            firstUseState: state,
            firstUseStep: step,
            policyVersion: "mvp-2026-08-04",
            lastReviewedAt: nil,
            reviewDueAt: nil,
            version: version,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-11T00:00:00.000Z"
        )
    }
}
