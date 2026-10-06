import XCTest
@testable import Rillora

@MainActor
final class OverviewStoreTests: XCTestCase {
    func testVerifiedLoginSnapshotEntersAppWithoutAnotherOverviewRequest() async {
        let service = SignedOutOverviewService()
        let overview = OverviewStore(service: service)
        let identity = PreparedNativeIdentity()
        let auth = AuthenticationStore(service: identity, overviewStore: overview)
        let signedIn = await auth.signIn()
        XCTAssertTrue(signedIn)
        XCTAssertEqual(overview.state, .loaded(.testFixture))
        XCTAssertFalse(auth.isWorking)
        let count = await service.fetchCount()
        XCTAssertEqual(count, 0)
        XCTAssertNil(identity.takeInitialOverview())
    }

    func testReloadPublishesLoadedSnapshot() async {
        let store = OverviewStore(service: StubOverviewService(snapshot: .testFixture))

        await store.reload()

        XCTAssertEqual(store.state, .loaded(.testFixture))
        XCTAssertFalse(store.requiresSignInAgain)
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
        XCTAssertFalse(store.requiresSignInAgain)
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
        XCTAssertTrue(store.requiresSignInAgain)
        store.reset()
        XCTAssertFalse(store.requiresSignInAgain)
    }

    func testCancelledLoadRestoresItsPreviousState() async {
        let store = OverviewStore(service: CancellingOverviewService())

        await store.reload()

        XCTAssertEqual(store.state, .idle)
    }

    func testFailedRefreshKeepsLoadedMapAndRetryClearsNotice() async {
        let service = RecoveringOverviewService()
        let store = OverviewStore(service: service)
        await store.reload()
        await service.setFailure(.requestFailed("Offline"))

        await store.reload()

        XCTAssertEqual(store.state, .loaded(.testFixture))
        XCTAssertEqual(store.refreshError, "Offline")
        XCTAssertFalse(store.isRefreshing)

        await service.setFailure(nil)
        await store.reload()
        XCTAssertEqual(store.state, .loaded(.testFixture))
        XCTAssertNil(store.refreshError)
    }

    func testExpiredSessionDiscardsPreviouslyLoadedPrivateMap() async {
        let service = RecoveringOverviewService()
        let store = OverviewStore(service: service)
        await store.reload()
        await service.setFailure(.server(status: 401, code: "authentication_required", message: "Sign in again", requestID: nil))

        await store.reload()

        XCTAssertEqual(store.state, .signedOut)
        XCTAssertNil(store.refreshError)
        XCTAssertTrue(store.requiresSignInAgain)

        await service.setFailure(nil)
        await store.reload()
        XCTAssertEqual(store.state, .loaded(.testFixture))
        XCTAssertFalse(store.requiresSignInAgain)
    }

    func testMutationReconciliationDoesNotKeepAnExpiredSession() async {
        let service = RecoveringOverviewService()
        let store = OverviewStore(service: service)
        await store.reload()
        await service.setFailure(.server(status: 401, code: "authentication_required", message: "Sign in again", requestID: nil))

        await store.reconcileAfterMutation()

        XCTAssertEqual(store.state, .signedOut)
        XCTAssertNil(store.refreshError)
        XCTAssertTrue(store.requiresSignInAgain)
    }

    func testOlderRefreshCannotOverwriteAConfirmedSave() async {
        let service = SuspendedOverviewService()
        let store = OverviewStore(service: service)
        await store.reload()
        await service.suspendNextFetch()
        let refresh = Task { await store.reload() }
        await service.waitForSuspension()
        let original = OverviewSnapshot.testFixture.plan
        let saved = Plan(
            publicId: original.publicId, motivation: original.motivation,
            status: original.status, firstUseState: .guidePaused, firstUseStep: 1,
            policyVersion: original.policyVersion, lastReviewedAt: nil,
            reviewDueAt: nil, version: 2, createdAt: original.createdAt,
            updatedAt: original.updatedAt
        )
        store.applySavedPlan(saved)
        await service.finishSuspended(.success(.testFixture))
        await refresh.value

        guard case .loaded(let snapshot) = store.state else { return XCTFail("Saved map disappeared") }
        XCTAssertEqual(snapshot.plan, saved)
        XCTAssertFalse(store.isRefreshing)
    }

    func testOldSessionRefreshCannotClearTheNewSession() async {
        let service = SuspendedOverviewService()
        let store = OverviewStore(service: service)
        await store.reload()
        await service.suspendNextFetch()
        let oldRefresh = Task { await store.reload() }
        await service.waitForSuspension()
        store.reset()
        await store.reload()
        await service.finishSuspended(.failure(.server(
            status: 401, code: "authentication_required", message: "Old session expired", requestID: nil
        )))
        await oldRefresh.value

        XCTAssertEqual(store.state, .loaded(.testFixture))
        XCTAssertNil(store.refreshError)
        XCTAssertFalse(store.isRefreshing)
    }
}

private actor SuspendedOverviewService: OverviewServing {
    private var shouldSuspend = false
    private var pending: CheckedContinuation<OverviewSnapshot, any Error>?
    private var observer: CheckedContinuation<Void, Never>?

    func suspendNextFetch() { shouldSuspend = true }

    func waitForSuspension() async {
        if pending != nil { return }
        await withCheckedContinuation { observer = $0 }
    }

    func finishSuspended(_ result: Result<OverviewSnapshot, RilloraAPIError>) {
        pending?.resume(with: result.mapError { $0 as any Error })
        pending = nil
    }

    func fetchOverview() async throws -> OverviewSnapshot {
        guard shouldSuspend else { return .testFixture }
        shouldSuspend = false
        return try await withCheckedThrowingContinuation { continuation in
            pending = continuation
            observer?.resume()
            observer = nil
        }
    }
}

private actor RecoveringOverviewService: OverviewServing {
    private var failure: RilloraAPIError?
    func setFailure(_ value: RilloraAPIError?) { failure = value }
    func fetchOverview() async throws -> OverviewSnapshot {
        if let failure { throw failure }
        return .testFixture
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

extension OverviewSnapshot {
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

@MainActor
private final class PreparedNativeIdentity: NativeAuthenticating {
    let isConfigured = true
    let canSignInWithApple = false
    let canSignInWithGoogle = false
    let canSignInWithPasskey = false
    private var snapshot: OverviewSnapshot? = .testFixture
    func takeInitialOverview() -> OverviewSnapshot? { defer { snapshot = nil }; return snapshot }
    func signIn(intent: NativeAuthenticationIntent, loginHint: String?) async throws {}
    func signInWithApple(authorizationCode: String, fullName: PersonNameComponents?, legalAcceptance: LegalAcceptanceProof) async throws {}
    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async throws {}
    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async throws {}
    func signOut() async {}
    func signOutAll() async throws {}
}
