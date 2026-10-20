import XCTest
@testable import Rillora

@MainActor
final class RoleAssignmentPolicyStoreTests: XCTestCase {
    func testReloadAndDuplicateCreateCannotReplaceAnInFlightRoleMutation() async throws {
        let created = try assignment(publicID: "44444444-4444-4444-8444-444444444444", role: "executor", scope: "plan_wide", matter: "null")
        let entered = expectation(description: "Role mutation is in flight")
        let service = RoleAssignmentServiceStub(assignments: [], mutationAssignment: created, suspendFirstMutation: entered)
        let store = RoleAssignmentPolicyStore(service: service)
        await store.loadIfNeeded()
        let first = Task { await store.create(personPublicID: created.person.publicId, role: .executor, scope: .planWide, matterPublicID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") }
        await fulfillment(of: [entered], timeout: 2)
        await store.reload()
        let duplicate = await store.create(personPublicID: created.person.publicId, role: .executor, scope: .planWide, matterPublicID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        let during = store.state
        await service.releaseMutation()
        _ = await first.value
        let count = await service.createCount()
        XCTAssertFalse(duplicate)
        XCTAssertEqual(during, .working)
        XCTAssertEqual(count, 1)
        XCTAssertEqual(store.assignments, [created])
    }

    func testAcknowledgedRoleIsRetainedWhenTheFollowingRefreshFails() async throws {
        let created = try assignment(publicID: "44444444-4444-4444-8444-444444444444", role: "executor", scope: "plan_wide", matter: "null")
        let service = RoleAssignmentServiceStub(assignments: [], mutationAssignment: created, failPostMutationFetch: true)
        let store = RoleAssignmentPolicyStore(service: service)
        await store.loadIfNeeded()
        let saved = await store.create(personPublicID: created.person.publicId, role: .executor, scope: .planWide, matterPublicID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        XCTAssertTrue(saved, "A failed read after acknowledged persistence must not report the write as failed")
        XCTAssertEqual(store.assignments, [created])
        XCTAssertEqual(store.state, .loaded)
        XCTAssertEqual(store.notice, "Role policy saved. Reload to check the latest records.")
        XCTAssertTrue(store.needsReload)
        await service.restoreReads()
        await store.reload()
        XCTAssertFalse(store.needsReload)
        XCTAssertNil(store.notice)
        XCTAssertEqual(store.assignments, [created])
    }

    func testAcknowledgedRevocationStaysRemovedWhenTheFollowingRefreshFails() async throws {
        let existing = try assignment(publicID: "44444444-4444-4444-8444-444444444444", role: "executor", scope: "plan_wide", matter: "null")
        let service = RoleAssignmentServiceStub(assignments: [existing], failPostMutationFetch: true)
        let store = RoleAssignmentPolicyStore(service: service)
        await store.loadIfNeeded()
        let revoked = await store.revoke(existing)
        XCTAssertTrue(revoked)
        XCTAssertTrue(store.assignments.isEmpty)
        XCTAssertTrue(store.needsReload)
    }

    func testLoadKeepsPlanWideAndCurrentMatterAssignmentsSeparate() async throws {
        let planWide = try assignment(
            publicID: "11111111-1111-4111-8111-111111111111",
            role: "executor",
            scope: "plan_wide",
            matter: "null"
        )
        let current = try assignment(
            publicID: "22222222-2222-4222-8222-222222222222",
            role: "recipient",
            scope: "matter_specific",
            matter: #"{"publicId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","title":"Current"}"#
        )
        let other = try assignment(
            publicID: "33333333-3333-4333-8333-333333333333",
            role: "executor",
            scope: "matter_specific",
            matter: #"{"publicId":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","title":"Other"}"#
        )
        let service = RoleAssignmentServiceStub(assignments: [planWide, current, other])
        let store = RoleAssignmentPolicyStore(service: service)

        await store.loadIfNeeded()

        XCTAssertEqual(store.state, .loaded)
        XCTAssertEqual(
            store.assignments(applyingTo: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa").map(\.publicId),
            [planWide.publicId, current.publicId]
        )
    }

    func testCreateUsesMatterScopeAndMarksEarlierRehearsalsStale() async throws {
        let created = try assignment(
            publicID: "44444444-4444-4444-8444-444444444444",
            role: "executor",
            scope: "matter_specific",
            matter: #"{"publicId":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","title":"Current"}"#
        )
        let service = RoleAssignmentServiceStub(assignments: [], mutationAssignment: created)
        let store = RoleAssignmentPolicyStore(service: service)
        await store.loadIfNeeded()

        let saved = await store.create(
            personPublicID: "55555555-5555-4555-8555-555555555555",
            role: .executor,
            scope: .matterSpecific,
            matterPublicID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        )

        XCTAssertTrue(saved)
        XCTAssertEqual(store.state, .loaded)
        XCTAssertEqual(store.notice, "Role policy saved. Earlier disclosure rehearsals are now stale.")
        let capturedRequest = await service.lastCreateRequest()
        let request = try XCTUnwrap(capturedRequest)
        XCTAssertEqual(request.scope, .matterSpecific)
        XCTAssertEqual(request.matterPublicId, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa")
        XCTAssertTrue(request.acknowledgesRecordOnly)
        XCTAssertTrue(request.acknowledgesNoAuthority)
    }

    func testFailedMutationPreservesAssignmentsAndExposesConflict() async throws {
        let existing = try assignment(
            publicID: "66666666-6666-4666-8666-666666666666",
            role: "executor",
            scope: "plan_wide",
            matter: "null"
        )
        let service = RoleAssignmentServiceStub(assignments: [existing])
        let store = RoleAssignmentPolicyStore(service: service)
        await store.loadIfNeeded()
        await service.failMutations()

        let saved = await store.update(
            assignment: existing,
            role: .trustedContact,
            scope: .planWide,
            matterPublicID: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
        )

        XCTAssertFalse(saved)
        XCTAssertEqual(store.assignments, [existing])
        guard case .failed(_, let conflict) = store.state else {
            return XCTFail("Expected a recoverable conflict")
        }
        XCTAssertTrue(conflict)
    }

    private func assignment(
        publicID: String,
        role: String,
        scope: String,
        matter: String
    ) throws -> RoleAssignment {
        let json = #"{"publicId":"\#(publicID)","person":{"publicId":"99999999-9999-4999-8999-999999999999","displayName":"Maya Chen","relationshipLabel":"Sister"},"role":"\#(role)","scope":"\#(scope)","matter":\#(matter),"status":"draft","evidence":"record_only","invitationStatus":null,"editable":true,"version":1,"createdAt":"2026-08-10T00:00:00.000Z","updatedAt":"2026-08-10T00:00:00.000Z"}"#
        return try JSONDecoder().decode(RoleAssignment.self, from: Data(json.utf8))
    }
}

private actor RoleAssignmentServiceStub: RoleAssignmentEditing {
    private var assignments: [RoleAssignment]
    private let mutationAssignment: RoleAssignment?
    private var createRequest: RoleAssignmentCreateRequest?
    private var shouldFailMutations = false
    private var suspendFirstMutation: XCTestExpectation?
    private var pendingMutation: CheckedContinuation<Void, Never>?
    private var failPostMutationFetch: Bool
    private var hasMutated = false
    private var creates = 0

    init(assignments: [RoleAssignment], mutationAssignment: RoleAssignment? = nil,
         suspendFirstMutation: XCTestExpectation? = nil, failPostMutationFetch: Bool = false) {
        self.assignments = assignments
        self.mutationAssignment = mutationAssignment
        self.suspendFirstMutation = suspendFirstMutation
        self.failPostMutationFetch = failPostMutationFetch
    }

    func fetchRoleAssignments() async throws -> [RoleAssignment] {
        if failPostMutationFetch && hasMutated { throw RilloraAPIError.requestFailed("Synthetic read outage after commit") }
        return assignments
    }

    func createRoleAssignment(
        request: RoleAssignmentCreateRequest
    ) async throws -> RoleAssignmentMutationResult {
        if shouldFailMutations { throw conflict }
        createRequest = request
        creates += 1
        if let entered = suspendFirstMutation {
            suspendFirstMutation = nil
            await withCheckedContinuation { continuation in
                pendingMutation = continuation
                entered.fulfill()
            }
        }
        if let mutationAssignment { assignments.append(mutationAssignment) }
        hasMutated = true
        return RoleAssignmentMutationResult(
            assignment: mutationAssignment,
            invalidatedDisclosureRehearsalCount: 1
        )
    }

    func updateRoleAssignment(
        publicID: String,
        request: RoleAssignmentUpdateRequest
    ) async throws -> RoleAssignmentMutationResult {
        if shouldFailMutations { throw conflict }
        hasMutated = true
        return RoleAssignmentMutationResult(
            assignment: mutationAssignment,
            invalidatedDisclosureRehearsalCount: 0
        )
    }

    func revokeRoleAssignment(
        publicID: String,
        expectedVersion: Int
    ) async throws -> RoleAssignmentMutationResult {
        if shouldFailMutations { throw conflict }
        assignments.removeAll { $0.publicId == publicID }
        hasMutated = true
        return RoleAssignmentMutationResult(
            assignment: nil,
            invalidatedDisclosureRehearsalCount: 0
        )
    }

    func lastCreateRequest() -> RoleAssignmentCreateRequest? { createRequest }
    func failMutations() { shouldFailMutations = true }
    func createCount() -> Int { creates }
    func releaseMutation() { pendingMutation?.resume(); pendingMutation = nil }
    func restoreReads() { failPostMutationFetch = false }

    private var conflict: RilloraAPIError {
        .server(
            status: 409,
            code: "version_conflict",
            message: "Refresh and try again.",
            requestID: "test"
        )
    }
}
