import XCTest
@testable import Rillora

@MainActor
final class OverviewStoreTests: XCTestCase {
    func testReloadPublishesLoadedSnapshot() async {
        let store = OverviewStore(service: StubOverviewService(snapshot: .testFixture))

        await store.reload()

        XCTAssertEqual(store.state, .loaded(.testFixture))
    }

    func testReloadPublishesSafeFailureState() async {
        let store = OverviewStore(service: StubOverviewService(error: .requestFailed("Offline")))

        await store.reload()

        XCTAssertEqual(store.state, .failed(message: "Offline"))
    }

    func testReloadPublishesSignedOutWithoutFetchingPrivateOverview() async {
        let service = SignedOutOverviewService()
        let store = OverviewStore(service: service)

        await store.reload()

        XCTAssertEqual(store.state, .signedOut)
        let fetchCount = await service.fetchCount()
        XCTAssertEqual(fetchCount, 0)
    }

    func testAuthenticationFailureBecomesSignedOutInsteadOfAnErrorWall() async {
        let store = OverviewStore(service: StubOverviewService(error: .server(
            status: 401,
            code: "authentication_required",
            message: "Authentication is required.",
            requestID: nil
        )))

        await store.reload()

        XCTAssertEqual(store.state, .signedOut)
    }

    func testCancelledLoadRestoresItsPreviousState() async {
        let store = OverviewStore(service: CancellingOverviewService())

        await store.reload()

        XCTAssertEqual(store.state, .idle)
    }
}

private actor StubOverviewService: OverviewServing {
    private let result: Result<OverviewSnapshot, RilloraAPIError>

    init(snapshot: OverviewSnapshot) {
        result = .success(snapshot)
    }

    init(error: RilloraAPIError) {
        result = .failure(error)
    }

    func fetchOverview() async throws -> OverviewSnapshot {
        try result.get()
    }
}

private actor CancellingOverviewService: OverviewServing {
    func fetchOverview() async throws -> OverviewSnapshot {
        throw CancellationError()
    }
}

private actor SignedOutOverviewService: OverviewServing {
    private var count = 0

    func hasLocalSession() async throws -> Bool { false }

    func fetchOverview() async throws -> OverviewSnapshot {
        count += 1
        return .testFixture
    }

    func fetchCount() -> Int { count }
}

private extension OverviewSnapshot {
    static let testFixture = OverviewSnapshot(
        session: SessionInfo(
            plannerPublicId: "11111111-1111-4111-8111-111111111111",
            authenticationMode: "development",
            authenticationMethods: [],
            authenticatedAt: nil
        ),
        plan: Plan(
            publicId: "22222222-2222-4222-8222-222222222222",
            motivation: nil,
            status: "active",
            firstUseState: .available,
            firstUseStep: 0,
            policyVersion: "initial-v1",
            lastReviewedAt: nil,
            reviewDueAt: nil,
            version: 1,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-08T00:00:00.000Z"
        ),
        matters: [],
        trustedContacts: [],
        readiness: Readiness(
            totalMatters: 0,
            readyMatters: 0,
            assignedOutcomes: 0,
            confirmedContacts: 0,
            completedOfficialChecks: 0,
            completedSimulations: 0,
            verifiedEmergencyPlan: false,
            confirmationEvidenceMayBeSimulated: true
        )
    )
}
