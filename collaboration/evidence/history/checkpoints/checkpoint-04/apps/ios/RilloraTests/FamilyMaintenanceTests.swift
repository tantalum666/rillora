import Foundation
import XCTest
@testable import Rillora

final class FamilyMaintenanceTests: XCTestCase {
    private let id = "11111111-1111-4111-8111-111111111111"
    private func task(_ overrides: [String: Any] = [:]) throws -> FamilyReviewTask {
        let base: [String: Any] = [
            "publicId": id, "roundPublicId": id, "roundState": "open", "matterPublicId": id,
            "connectionPublicId": id, "ownerName": "Owner", "personName": "Reviewer", "title": "Shared direction",
            "state": "confirmed", "version": 2, "sourceVersion": 1, "currentVersion": 1,
            "fields": ["institutionName": "Archive", "locationHint": "Blue folder"], "proposal": NSNull(), "reason": NSNull(),
            "dueAt": "2026-09-17T00:00:00Z", "respondedAt": NSNull(), "decidedAt": NSNull(),
            "scopeAvailable": true, "isStale": false, "canRespond": true, "canSuggest": false, "canManage": false,
        ]
        return try JSONDecoder().decode(FamilyReviewTask.self, from: JSONSerialization.data(withJSONObject: base.merging(overrides) { _, new in new }))
    }
    private func overview(incoming: [FamilyReviewTask] = []) -> FamilyMaintenanceOverview {
        .init(contractVersion: "family-maintenance-v1", access: .init(mode: "preview", canCreate: true),
              settings: .init(version: 0, cadenceDays: 90, nextReviewAt: nil, collaboratorConnectionPublicId: nil),
              eligible: [], rounds: [], incoming: incoming, history: [], serverTime: "2026-09-10T00:00:00Z",
              boundaries: .init(ownerApprovalRequired: true, recipientScopeEnforced: true, externalNotificationsSent: false, billingActivated: false), shareUrl: "https://app.staging.rillora.xyz/account?next=reviews")
    }
    func testChangedSourceOrScopeDoesNotCountAsCompleted() throws {
        XCTAssertTrue(try task().isResolved)
        XCTAssertFalse(try task(["isStale": true, "currentVersion": 2]).isResolved)
        XCTAssertEqual(try task(["isStale": true]).statusLabel, "Check again")
        XCTAssertFalse(try task(["scopeAvailable": false]).isResolved)
    }
    func testReviewFieldsCannotContainHiddenDataOrDisclosureChanges() throws {
        XCTAssertTrue(try task().isValid)
        XCTAssertFalse(try task(["fields": ["accountHint": "hidden"]]).isValid)
        XCTAssertFalse(try task(["proposal": ["desiredOutcome": "transfer_request"]]).isValid)
        XCTAssertFalse(try task(["proposal": ["password": "[REDACTED_CREDENTIAL]"]]).isValid)
    }
    func testIncomingResponseCannotGrantOwnerControl() throws {
        XCTAssertTrue(overview(incoming: [try task()]).isValid)
        XCTAssertFalse(overview(incoming: [try task(["canManage": true])]).isValid)
        XCTAssertFalse(overview(incoming: [try task(["scopeAvailable": false])]).isValid)
    }
    func testSettingsEncodeExplicitNullForRemovingCollaboratorAndDate() throws {
        let data = try JSONEncoder().encode(FamilyReviewSettingsRequest(expectedVersion: 3, cadenceDays: 0, collaboratorConnectionPublicId: nil, nextReviewAt: nil))
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertTrue(json["collaboratorConnectionPublicId"] is NSNull)
        XCTAssertTrue(json["nextReviewAt"] is NSNull)
        XCTAssertEqual(json["expectedVersion"] as? Int, 3)
    }
    @MainActor func testExpiredWriteClearsPrivateCache() async {
        let store = FamilyMaintenanceStore(service: MaintenanceFixtureService(value: overview()))
        await store.reload(); XCTAssertNotNil(store.data)
        let saved = await store.perform {
            throw RilloraAPIError.server(status: 401, code: "authentication_required", message: "Sign in again", requestID: nil)
        }
        XCTAssertFalse(saved); XCTAssertNil(store.data); XCTAssertTrue(store.requiresAuthentication)
    }
}
private struct MaintenanceFixtureService: FamilyMaintenanceServing {
    let value: FamilyMaintenanceOverview
    func fetchFamilyMaintenance() async throws -> FamilyMaintenanceOverview { value }
    func startFamilyReview(_ request: FamilyReviewStartRequest) async throws {}
    func saveFamilyReviewSettings(_ request: FamilyReviewSettingsRequest) async throws {}
    func respondToFamilyReview(_ id: String, request: FamilyReviewResponseRequest) async throws {}
    func decideFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws {}
    func closeFamilyReview(_ id: String, request: FamilyReviewActionRequest) async throws {}
}
