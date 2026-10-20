import Foundation
import XCTest
@testable import Rillora

final class SharingTests: XCTestCase {
    private let connectionID = "11111111-1111-4111-8111-111111111111"
    private let matterID = "22222222-2222-4222-8222-222222222222"
    private func item(_ level: SharingDetailLevel, extra: [String: String] = [:]) -> SharedMatterItem {
        SharedMatterItem(connectionPublicId: connectionID, ownerName: "A", matterPublicId: matterID,
                         detailLevel: level, fields: ["title": "Shared document", "category": "document"].merging(extra) { _, next in next })
    }
    func testNameAccessRejectsUnexpectedLocation() {
        XCTAssertTrue(item(.name).isValid)
        XCTAssertFalse(item(.name, extra: ["locationHint": "Private folder"]).isValid)
    }
    func testDirectionsRejectFinancialDetails() {
        XCTAssertTrue(item(.directions, extra: ["locationHint": "Shared folder"]).isValid)
        XCTAssertFalse(item(.directions, extra: ["accountHint": "ending 42"]).isValid)
        XCTAssertFalse(item(.directions, extra: ["valueBand": "unknown"]).isValid)
    }
    func testDetailsRemainBoundedToSafeFields() {
        XCTAssertTrue(item(.details, extra: ["accountHint": "ending 42", "importance": "important"]).isValid)
        XCTAssertFalse(item(.details, extra: ["password": "must not appear"]).isValid)
    }
    func testEnvelopeRejectsWriteOrReleaseAuthority() {
        let connection = IncomingSharingConnection(publicId: connectionID, ownerName: "A", acceptedAt: "2026-09-10T00:00:00Z", readOnly: true)
        XCTAssertTrue(SharedWithMeEnvelope(connections: [connection], items: [item(.name)], readOnly: true, purpose: "planner_directed").isValid)
        XCTAssertFalse(SharedWithMeEnvelope(connections: [connection], items: [item(.name)], readOnly: false, purpose: "planner_directed").isValid)
        XCTAssertFalse(SharedWithMeEnvelope(connections: [connection], items: [item(.name)], readOnly: true, purpose: "death_release").isValid)
    }
    func testItemsMustBelongToAVisibleConnection() {
        XCTAssertFalse(SharedWithMeEnvelope(connections: [], items: [item(.name)], readOnly: true, purpose: "planner_directed").isValid)
    }
    func testInvitationCapabilityMustBeACompleteFragment() {
        let token = String(repeating: "x", count: 43)
        XCTAssertEqual(ReceivedInvitation.token(from: "https://app.rillora.xyz/invite#invitation=\(token)"), token)
        XCTAssertNil(ReceivedInvitation.token(from: "rillora://invite#invitation=\(token)"))
        XCTAssertNil(ReceivedInvitation.token(from: "https://attacker.example/invite#invitation=\(token)"))
        XCTAssertNil(ReceivedInvitation.token(from: "http://app.rillora.xyz/invite#invitation=\(token)"))
        XCTAssertNil(ReceivedInvitation.token(from: "https://app.rillora.xyz/invite?invitation=\(token)"))
        XCTAssertNil(ReceivedInvitation.token(from: "javascript:alert(1)#invitation=\(token)"))
        XCTAssertNil(ReceivedInvitation.token(from: "rillora://invite#invitation=short"))
    }
    func testSavedCopyDecodesItsActualDateAndStaysWithinItsSavedScope() throws {
        let data = Data("""
        {"connectionPublicId":"\(connectionID)","ownerName":"A","matterPublicId":"\(matterID)","detailLevel":"name","fields":{"title":"Saved document","category":"document"},"accessMode":"saved","savedAt":"2026-09-16T01:00:00.000Z","cutoffAt":"2026-09-17T01:00:00.000Z"}
        """.utf8)
        let saved = try JSONDecoder().decode(SharedMatterItem.self, from: data)
        XCTAssertEqual(saved.accessMode, .saved)
        XCTAssertTrue(saved.isValid)
        XCTAssertTrue(saved.savedCopyLabel?.contains("Updates paused") == true)
        XCTAssertEqual(saved.fields.count, 2)
    }
    func testReplacementRequestNamesBothCurrentVersions() throws {
        var create = SharingCreateRequest(personPublicId: matterID, email: "new@example.test", grants: [])
        create.replaceConnection = SharingReplacement(publicId: connectionID, expectedVersion: 7, expectedAccessVersion: 3)
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: JSONEncoder().encode(create)) as? [String: Any])
        let replacement = try XCTUnwrap(payload["replaceConnection"] as? [String: Any])
        XCTAssertEqual(replacement["publicId"] as? String, connectionID)
        XCTAssertEqual(replacement["expectedVersion"] as? Int, 7)
        XCTAssertEqual(replacement["expectedAccessVersion"] as? Int, 3)
    }
}
