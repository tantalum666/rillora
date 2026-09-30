import XCTest
@testable import Rillora

@MainActor
final class DisclosureRehearsalStoreTests: XCTestCase {
    func testCreateUsesSelectedDistinctEventAndPublishesRehearsal() async throws {
        let fixture = DisclosureRehearsal.fixture(
            lifeEvent: .missing,
            state: "missing_report_opened",
            version: 1
        )
        let service = StubDisclosureRehearsalService(
            createResult: .value(fixture),
            updateResult: .value(fixture)
        )
        let store = DisclosureRehearsalStore(service: service)
        store.selectedLifeEvent = .missing

        let created = await store.create()

        XCTAssertEqual(created, fixture)
        XCTAssertEqual(store.phase, .loaded)
        XCTAssertEqual(store.rehearsal, fixture)
        let requests = await service.recordedCreateRequests()
        XCTAssertEqual(requests, [DisclosureRehearsalCreateRequest(lifeEvent: .missing)])
    }

    func testActionUsesLatestOptimisticVersionAndFixedAcknowledgement() async throws {
        let created = DisclosureRehearsal.fixture(
            lifeEvent: .death,
            state: "death_claim_opened",
            version: 1
        )
        let advanced = DisclosureRehearsal.fixture(
            lifeEvent: .death,
            state: "death_identity_review",
            version: 2
        )
        let service = StubDisclosureRehearsalService(
            createResult: .value(created),
            updateResult: .value(advanced)
        )
        let store = DisclosureRehearsalStore(service: service)
        _ = await store.create()

        let updated = await store.perform(.advance)

        XCTAssertEqual(updated, advanced)
        XCTAssertEqual(store.rehearsal?.version, 2)
        let requests = await service.recordedUpdateRequests()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.publicID, created.publicId)
        XCTAssertEqual(request.request.expectedVersion, 1)
        XCTAssertEqual(request.request.action, .advance)
        XCTAssertTrue(request.request.acknowledgesSimulationOnly)
    }

    func testCancellationRestoresIdleAndFailureCanRecoverWithoutDiscardingResult() async {
        let cancelledService = StubDisclosureRehearsalService(
            createResult: .cancelled,
            updateResult: .cancelled
        )
        let cancelledStore = DisclosureRehearsalStore(service: cancelledService)
        let cancelled = await cancelledStore.create()
        XCTAssertNil(cancelled)
        XCTAssertEqual(cancelledStore.phase, .idle)

        let fixture = DisclosureRehearsal.fixture(
            lifeEvent: .death,
            state: "death_claim_opened",
            version: 1
        )
        let failingService = StubDisclosureRehearsalService(
            createResult: .value(fixture),
            updateResult: .failure(.requestFailed("Offline"))
        )
        let failingStore = DisclosureRehearsalStore(service: failingService)
        _ = await failingStore.create()
        let failed = await failingStore.perform(.advance)
        XCTAssertNil(failed)
        XCTAssertEqual(failingStore.phase, .failed(message: "Offline"))
        XCTAssertEqual(failingStore.rehearsal, fixture)
        failingStore.clearFailure()
        XCTAssertEqual(failingStore.phase, .loaded)
    }
}

private enum StubDisclosureResult: Sendable {
    case value(DisclosureRehearsal)
    case failure(RilloraAPIError)
    case cancelled

    func get() throws -> DisclosureRehearsal {
        switch self {
        case .value(let rehearsal): rehearsal
        case .failure(let error): throw error
        case .cancelled: throw CancellationError()
        }
    }
}

private actor StubDisclosureRehearsalService: DisclosureRehearsing {
    struct UpdateCall: Sendable {
        let publicID: String
        let request: DisclosureRehearsalActionRequest
    }

    private let createResult: StubDisclosureResult
    private let updateResult: StubDisclosureResult
    private var createRequests: [DisclosureRehearsalCreateRequest] = []
    private var updateRequests: [UpdateCall] = []

    init(createResult: StubDisclosureResult, updateResult: StubDisclosureResult) {
        self.createResult = createResult
        self.updateResult = updateResult
    }

    func createDisclosureRehearsal(
        request: DisclosureRehearsalCreateRequest
    ) async throws -> DisclosureRehearsal {
        createRequests.append(request)
        return try createResult.get()
    }

    func updateDisclosureRehearsal(
        publicID: String,
        request: DisclosureRehearsalActionRequest
    ) async throws -> DisclosureRehearsal {
        updateRequests.append(UpdateCall(publicID: publicID, request: request))
        return try updateResult.get()
    }

    func recordedCreateRequests() -> [DisclosureRehearsalCreateRequest] { createRequests }
    func recordedUpdateRequests() -> [UpdateCall] { updateRequests }
}

private extension DisclosureRehearsal {
    static func fixture(
        lifeEvent: LifeEvent,
        state: String,
        version: Int
    ) -> DisclosureRehearsal {
        let trustedPolicy: [String]
        let matters: [DisclosureMatterPreview]
        let matterCount: Int
        switch lifeEvent {
        case .death:
            trustedPolicy = ["matter.title", "matter.category", "matter.desiredOutcome"]
            matters = [DisclosureMatterPreview(
                title: "Bank account",
                category: "financial_asset",
                desiredOutcome: "notify"
            )]
            matterCount = 1
        case .incapacity:
            trustedPolicy = ["matter.title", "matter.category"]
            matters = [DisclosureMatterPreview(title: "Bank account", category: "financial_asset")]
            matterCount = 1
        case .missing:
            trustedPolicy = ["planner.displayName", "planner.timeZone", "plan.matterCount"]
            matters = []
            matterCount = 5
        }
        let views = [
            DisclosureRoleView(
                role: "trusted_contact",
                previewStage: "guidance",
                eligibleForProjectedPreview: true,
                reason: "Projected guidance only.",
                assignedPeople: [],
                fieldPolicy: trustedPolicy,
                matters: matters,
                summary: DisclosureRoleSummary(matterCount: matterCount)
            ),
            DisclosureRoleView(
                role: "executor",
                previewStage: "none",
                eligibleForProjectedPreview: false,
                reason: "No active assignment.",
                assignedPeople: [],
                fieldPolicy: [],
                matters: [],
                summary: DisclosureRoleSummary(matterCount: 0)
            ),
            DisclosureRoleView(
                role: "recipient",
                previewStage: "none",
                eligibleForProjectedPreview: false,
                reason: "No active assignment.",
                assignedPeople: [],
                fieldPolicy: [],
                matters: [],
                summary: DisclosureRoleSummary(matterCount: 0)
            ),
        ]
        let boundaries = DisclosureBoundaries(
            simulationOnly: true,
            operative: false,
            identityVerified: false,
            documentsVerified: false,
            multiPartyVerified: false,
            notificationsSent: false,
            dataReleased: false,
            releaseAvailable: false,
            legalAuthorityGranted: false
        )
        return DisclosureRehearsal(
            publicId: "99999999-9999-4999-8999-999999999999",
            lifeEvent: lifeEvent,
            state: state,
            stateLabel: state.replacingOccurrences(of: "_", with: " ").capitalized,
            policyVersion: "disclosure-rehearsal-2026-08-10-v1",
            policyLabel: "Illustrative policy",
            stateSequence: [DisclosureStateStep(key: state, label: "Current")],
            completedCheckpoints: [DisclosureCheckpoint(
                code: state,
                label: "Simulated",
                simulatedAt: "2026-08-10T00:00:00.000Z",
                realEvidenceCollected: false
            )],
            projectedRoleViews: views,
            snapshot: DisclosureSnapshot(
                schemaVersion: "disclosure-rehearsal-v1",
                capturedAt: "2026-08-10T00:00:00.000Z",
                lifeEvent: lifeEvent,
                policyIllustrative: true,
                operative: false,
                planner: DisclosurePlannerPreview(
                    displayName: "Alex Chen",
                    timeZone: "Asia/Shanghai"
                ),
                coolingOffDurationHours: 72,
                guardrails: [],
                roleViews: views
            ),
            availableActions: [.advance, .cancel],
            previewReady: false,
            snapshotFresh: true,
            invalidatedAt: nil,
            invalidatedReason: nil,
            coolingOffEndsAt: nil,
            coolingOffSimulatedAt: nil,
            appealedAt: nil,
            canceledAt: nil,
            version: version,
            createdAt: "2026-08-10T00:00:00.000Z",
            updatedAt: "2026-08-10T00:00:00.000Z",
            boundaries: boundaries
        )
    }
}
