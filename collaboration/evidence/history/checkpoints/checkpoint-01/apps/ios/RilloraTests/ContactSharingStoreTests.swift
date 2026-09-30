import Foundation
import XCTest
@testable import Rillora

@MainActor
final class ContactSharingStoreTests: XCTestCase {
    private func prepared() async -> (ContactSharingStore, SharingRefreshService) {
        let service = SharingRefreshService()
        let contact = TrustedContact(publicId: "22222222-2222-4222-8222-222222222222", displayName: "Recipient",
            relationshipLabel: nil, status: "draft", roleStatus: "draft", invitationStatus: nil,
            confirmationMode: nil, version: 1, createdAt: "2026-09-11T00:00:00Z", updatedAt: "2026-09-11T00:00:00Z")
        let store = ContactSharingStore(contact: contact, service: service)
        await store.load()
        store.email = "recipient@example.test"
        let saved = await store.save()
        XCTAssertTrue(saved)
        XCTAssertNotNil(store.invitationURL)
        return (store, service)
    }

    func testAcceptedRecipientStopsShowingThePendingInvitationLink() async {
        let (store, service) = await prepared()
        await service.change(status: .accepted, version: 2)
        await store.load()
        XCTAssertTrue(store.isConnected)
        XCTAssertNil(store.invitationURL)
        XCTAssertFalse(store.hasChanges)
    }

    func testRefreshKeepsCurrentLinkButDiscardsAnExternallyReplacedVersion() async {
        let (store, service) = await prepared()
        let original = store.invitationURL
        await store.load()
        XCTAssertEqual(store.invitationURL, original)
        await service.change(status: .pending, version: 2)
        await store.load()
        XCTAssertNil(store.invitationURL)
        XCTAssertEqual(store.connection?.version, 2)
    }
}

private actor SharingRefreshService: SharingServing {
    private var current: SharingConnection?
    private var unexpected: RilloraAPIError { .requestFailed("Unexpected test operation") }
    func updateSharingConnection(publicID: String, request: SharingUpdateRequest) async throws -> SharingMutation { throw unexpected }
    func regenerateSharingLink(publicID: String, request: SharingLinkRequest) async throws -> SharingMutation { throw unexpected }
    func revokeSharingConnection(publicID: String, expectedVersion: Int) async throws -> SharingMutation { throw unexpected }
    func resolveSharingInvitation(token: String) async throws -> SharingInvitation { throw unexpected }
    func acceptSharingInvitation(token: String) async throws -> String { throw unexpected }
    func fetchSharedWithMe() async throws -> SharedWithMeEnvelope { throw unexpected }
    func fetchSharingConnections() async throws -> [SharingConnection] { current.map { [$0] } ?? [] }
    func createSharingConnection(request: SharingCreateRequest) async throws -> SharingMutation {
        change(status: .pending, version: 1)
        return SharingMutation(connection: current!, invitationUrl: "https://app.example.test/invite#invitation=" + String(repeating: "a", count: 43))
    }
    func change(status: SharingConnectionStatus, version: Int) {
        current = SharingConnection(publicId: "11111111-1111-4111-8111-111111111111",
            personPublicId: "22222222-2222-4222-8222-222222222222", personName: "Recipient",
            emailHint: "re***@example.test", status: status, expiresAt: "2026-09-18T00:00:00Z",
            acceptedAt: status == .accepted ? "2026-09-11T00:00:00Z" : nil,
            version: version, grants: [], readOnly: true, purpose: "planner_directed")
    }
}
