import XCTest
@testable import Rillora

@MainActor
final class TrustedContactEditorStoreTests: XCTestCase {
    func testNewContactUsesRecordOnlyCreateContract() async throws {
        let created = TrustedContact.editorFixture(
            relationshipLabel: nil,
            status: "draft",
            roleStatus: "draft",
            invitationStatus: nil,
            version: 1
        )
        let service = StubTrustedContactService(create: .success(created))
        let store = TrustedContactEditorStore(contact: nil, service: service)
        store.draft.displayName = "  Avery Stone  "

        let saved = await store.save()

        XCTAssertEqual(saved, created)
        let requests = await service.recordedCreates()
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.displayName, "Avery Stone")
        XCTAssertNil(request.relationshipLabel)
        XCTAssertEqual(saved?.evidenceLabel, "Record only — no invitation sent")
    }

    func testEditUsesLatestOptimisticVersionAndAppliesResponse() async throws {
        let updated = TrustedContact.editorFixture(
            relationshipLabel: "Sibling",
            version: 2
        )
        let service = StubTrustedContactService(update: .success(updated))
        let store = TrustedContactEditorStore(contact: .editorFixture, service: service)
        store.draft.relationshipLabel = "Sibling"

        let saved = await store.save()

        XCTAssertEqual(saved, updated)
        XCTAssertEqual(store.source, updated)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first?.request)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.relationshipLabel, "Sibling")
        XCTAssertNil(request.status)
    }

    func testOpeningExistingContactLoadsLatestServerVersion() async {
        let latest = TrustedContact.editorFixture(
            relationshipLabel: "Emergency contact",
            version: 4
        )
        let service = StubTrustedContactService(fetch: .success([latest]))
        let store = TrustedContactEditorStore(contact: .editorFixture, service: service)

        await store.loadLatestIfNeeded()

        XCTAssertEqual(store.source?.version, 4)
        XCTAssertEqual(store.draft.relationshipLabel, "Emergency contact")
        XCTAssertEqual(store.state, .ready)
    }

    func testVersionConflictKeepsContactDraftForRecovery() async {
        let conflict = RilloraAPIError.server(
            status: 409,
            code: "version_conflict",
            message: "The record changed. Refresh and try again.",
            requestID: "request-2"
        )
        let service = StubTrustedContactService(update: .failure(conflict))
        let store = TrustedContactEditorStore(contact: .editorFixture, service: service)
        store.draft.displayName = "My edited name"

        let saved = await store.save()

        XCTAssertNil(saved)
        XCTAssertEqual(store.draft.displayName, "My edited name")
        XCTAssertEqual(
            store.state,
            .failed(message: "The record changed. Refresh and try again.", conflict: true)
        )
    }

    func testRevokeUsesPersistedIdentityAndExplicitRevokedStatus() async throws {
        let revoked = TrustedContact.editorFixture(
            status: "revoked",
            roleStatus: "revoked",
            invitationStatus: "revoked",
            version: 2
        )
        let service = StubTrustedContactService(update: .success(revoked))
        let store = TrustedContactEditorStore(contact: .editorFixture, service: service)
        store.draft.displayName = "Unsaved replacement"

        let saved = await store.revoke()

        XCTAssertEqual(saved, revoked)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first?.request)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.displayName, TrustedContact.editorFixture.displayName)
        XCTAssertEqual(request.status, "revoked")
        XCTAssertEqual(saved?.evidenceLabel, "Role revoked")
    }

    func testValidationStopsEmptyNameBeforeTransport() async {
        let service = StubTrustedContactService(update: .success(.editorFixture))
        let store = TrustedContactEditorStore(contact: .editorFixture, service: service)
        store.draft.displayName = "   "

        let saved = await store.save()

        XCTAssertNil(saved)
        let updates = await service.recordedUpdates()
        XCTAssertEqual(updates.count, 0)
        XCTAssertEqual(
            store.state,
            .failed(message: "Add the contact’s name.", conflict: false)
        )
    }
}

private actor StubTrustedContactService: TrustedContactEditing {
    private let fetchResult: Result<[TrustedContact], RilloraAPIError>
    private let createResult: Result<TrustedContact, RilloraAPIError>
    private let updateResult: Result<TrustedContact, RilloraAPIError>
    private var creates: [TrustedContactCreateRequest] = []
    private var updates: [(publicID: String, request: TrustedContactUpdateRequest)] = []

    init(
        fetch: Result<[TrustedContact], RilloraAPIError> = .success([.editorFixture]),
        create: Result<TrustedContact, RilloraAPIError> = .success(.editorFixture),
        update: Result<TrustedContact, RilloraAPIError> = .success(.editorFixture)
    ) {
        fetchResult = fetch
        createResult = create
        updateResult = update
    }

    func fetchTrustedContacts() async throws -> [TrustedContact] {
        try fetchResult.get()
    }

    func createTrustedContact(
        request: TrustedContactCreateRequest
    ) async throws -> TrustedContact {
        creates.append(request)
        return try createResult.get()
    }

    func updateTrustedContact(
        publicID: String,
        request: TrustedContactUpdateRequest
    ) async throws -> TrustedContact {
        updates.append((publicID, request))
        return try updateResult.get()
    }

    func recordedCreates() -> [TrustedContactCreateRequest] {
        creates
    }

    func recordedUpdates() -> [(publicID: String, request: TrustedContactUpdateRequest)] {
        updates
    }
}

private extension TrustedContact {
    static var editorFixture: TrustedContact {
        editorFixture(relationshipLabel: "Sister", version: 1)
    }

    static func editorFixture(
        relationshipLabel: String? = "Sister",
        status: String = "draft",
        roleStatus: String? = "draft",
        invitationStatus: String? = nil,
        version: Int
    ) -> TrustedContact {
        TrustedContact(
            publicId: "55555555-5555-4555-8555-555555555555",
            displayName: "Avery Stone",
            relationshipLabel: relationshipLabel,
            status: status,
            roleStatus: roleStatus,
            invitationStatus: invitationStatus,
            confirmationMode: nil,
            version: version,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-08T00:00:00.000Z"
        )
    }
}
