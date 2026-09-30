import XCTest
@testable import Rillora

@MainActor
final class SimulationStoreTests: XCTestCase {
    func testRunUsesSelectedDistinctLifeEventAndPublishesResult() async throws {
        let service = StubSimulationService(result: .value(.simulationFixture))
        let store = SimulationStore(service: service)
        store.selectedLifeEvent = .missing

        let result = await store.run()

        XCTAssertEqual(result, .simulationFixture)
        XCTAssertEqual(store.state, .completed(.simulationFixture))
        let requests = await service.recordedRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.lifeEvent, .missing)
    }

    func testCancellationRestoresPreviousReadyState() async {
        let service = StubSimulationService(result: .cancelled)
        let store = SimulationStore(service: service)
        store.selectedLifeEvent = .incapacity

        let result = await store.run()

        XCTAssertNil(result)
        XCTAssertEqual(store.state, .ready)
    }

    func testChangingScenarioClearsThePreviousScenarioResult() async {
        let store = SimulationStore(service: StubSimulationService(result: .value(.simulationFixture)))
        store.selectedLifeEvent = .missing
        _ = await store.run()
        store.selectedLifeEvent = .death
        XCTAssertEqual(store.state, .ready)
    }

    func testMismatchedResponseDoesNotBecomeTheChosenScenarioResult() async {
        let store = SimulationStore(service: StubSimulationService(result: .value(.simulationFixture)))
        store.selectedLifeEvent = .death
        let result = await store.run()
        XCTAssertNil(result)
        XCTAssertEqual(store.state, .failed(message: "The rehearsal returned a different scenario. Try again."))
    }

    func testAPIFailureProducesRecoverableFailureState() async {
        let service = StubSimulationService(
            result: .failure(.requestFailed("Offline"))
        )
        let store = SimulationStore(service: service)

        let result = await store.run()

        XCTAssertNil(result)
        XCTAssertEqual(store.state, .failed(message: "Offline"))
        store.clearFailure()
        XCTAssertEqual(store.state, .ready)
    }
}

private enum StubSimulationResult: Sendable {
    case value(ClaimSimulation)
    case failure(RilloraAPIError)
    case cancelled

    func get() throws -> ClaimSimulation {
        switch self {
        case .value(let simulation): simulation
        case .failure(let error): throw error
        case .cancelled: throw CancellationError()
        }
    }
}

private actor StubSimulationService: SimulationRunning {
    private let result: StubSimulationResult
    private var requests: [ClaimSimulationCreateRequest] = []

    init(result: StubSimulationResult) {
        self.result = result
    }

    func runSimulation(
        request: ClaimSimulationCreateRequest
    ) async throws -> ClaimSimulation {
        requests.append(request)
        return try result.get()
    }

    func recordedRequests() -> [ClaimSimulationCreateRequest] {
        requests
    }
}

private extension ClaimSimulation {
    static let simulationFixture = ClaimSimulation(
        publicId: "88888888-8888-4888-8888-888888888888",
        lifeEvent: .missing,
        policyVersion: "mvp-2026-08-04",
        completedAt: "2026-08-09T00:00:00.000Z",
        snapshot: SimulationSnapshot(
            schemaVersion: "simulation-v1",
            matterCount: 5,
            outcomeCount: 4,
            trustedContactCount: 1,
            operative: false
        ),
        simulationOnly: true,
        notificationsSent: false,
        dataReleased: false
    )
}
