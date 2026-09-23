import XCTest
@testable import Rillora

@MainActor
final class MatterEditorStoreTests: XCTestCase {
    func testSaveUsesCurrentVersionAndAppliesServerResponse() async throws {
        let updated = Matter.editorFixture(
            status: "ready",
            desiredOutcome: "notify",
            version: 2
        )
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(updated))
        let store = MatterEditorStore(matter: .editorFixture, service: service)
        store.draft.status = .ready
        store.draft.desiredOutcome = .notify

        let saved = await store.save()

        XCTAssertEqual(saved, updated)
        XCTAssertEqual(store.source, updated)
        XCTAssertEqual(store.state, .ready)
        let updates = await service.recordedUpdates()
        let request = try XCTUnwrap(updates.first)
        XCTAssertEqual(request.expectedVersion, 1)
        XCTAssertEqual(request.status, "ready")
        XCTAssertEqual(request.desiredOutcome, "notify")
    }

    func testVersionConflictKeepsDraftAndOffersRecoveryState() async {
        let conflict = RilloraAPIError.server(
            status: 409,
            code: "version_conflict",
            message: "The record changed. Refresh and try again.",
            requestID: "request-1"
        )
        let service = StubMatterService(fetch: .success(.editorFixture), update: .failure(conflict))
        let store = MatterEditorStore(matter: .editorFixture, service: service)
        store.draft.title = "My edited title"

        let saved = await store.save()

        XCTAssertNil(saved)
        XCTAssertEqual(store.draft.title, "My edited title")
        XCTAssertEqual(
            store.state,
            .failed(message: "The record changed. Refresh and try again.", conflict: true)
        )
    }

    func testValidationStopsAnEmptyTitleBeforeTransport() async {
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(.editorFixture))
        let store = MatterEditorStore(matter: .editorFixture, service: service)
        store.draft.title = "   "

        let saved = await store.save()

        XCTAssertNil(saved)
        let updates = await service.recordedUpdates()
        XCTAssertEqual(updates.count, 0)
        XCTAssertEqual(
            store.state,
            .failed(message: "Add a short name for this matter.", conflict: false)
        )
    }

    func testNewMatterUsesCreateContract() async throws {
        let created = Matter.editorFixture(
            status: "draft",
            desiredOutcome: "notify",
            version: 1
        )
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(created))
        let store = MatterEditorStore(matter: nil, service: service)
        store.draft.title = "Emergency fund"
        store.draft.institutionName = "Example bank"
        store.draft.category = .financialAsset
        store.draft.desiredOutcome = .notify

        let saved = await store.save()

        XCTAssertEqual(saved, created)
        let creates = await service.recordedCreates()
        let request = try XCTUnwrap(creates.first)
        XCTAssertEqual(request.title, "Emergency fund")
        XCTAssertEqual(request.category, "financial_asset")
        XCTAssertEqual(request.desiredOutcome, "notify")
        XCTAssertNotNil(UUID(uuidString: request.requestId ?? ""))
    }

    func testCreateRetryKeepsTheSameRequestIdentityAndDraft() async throws {
        let service = StubMatterService(fetch: .success(.editorFixture), update: .failure(RilloraAPIError.requestFailed("Connection lost")))
        let store = MatterEditorStore(matter: nil, service: service)
        store.draft.title = "Retry draft"; store.draft.institutionName = "QA provider"
        _ = await store.save(); _ = await store.save()
        let creates = await service.recordedCreates()
        XCTAssertEqual(creates.count, 2)
        XCTAssertEqual(creates.first?.requestId, creates.last?.requestId)
        XCTAssertEqual(store.draft.title, "Retry draft")
    }

    func testFirstUseDraftKeepsChosenCategoryWithoutPrefillingMatter() {
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(.editorFixture))
        let store = MatterEditorStore(
            matter: nil,
            initialDraft: MatterDraft(firstUseCategory: .document),
            service: service
        )

        XCTAssertEqual(store.draft.category, .document)
        XCTAssertTrue(store.draft.title.isEmpty)
        XCTAssertTrue(store.isNew)
    }

    func testRequiredLocatorsAndCryptoBranchesStopTransport() async {
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(.editorFixture))
        let store = MatterEditorStore(matter: nil, service: service)
        store.draft.title = "Named item"
        for category in MatterCategory.allCases {
            store.draft = MatterDraft(firstUseCategory: category)
            store.draft.title = "Named item"
            XCTAssertFalse(store.canSave, category.rawValue)
            let saved = await store.save()
            XCTAssertNil(saved)
        }
        let calls = await service.recordedCreates()
        XCTAssertTrue(calls.isEmpty)
        store.draft = MatterDraft(firstUseCategory: .cryptoAsset)
        store.draft.title = "Wallet"
        store.draft.details = ["cryptoCustody": "self_custody", "network": "Ethereum"]
        XCTAssertFalse(store.canSave)
        store.draft.details["walletAddress"] = "0x1234"
        XCTAssertTrue(store.canSave)
        store.draft.details["cryptoCustody"] = "exchange"
        XCTAssertFalse(store.canSave)
        store.draft.institutionName = "Exchange"
        XCTAssertTrue(store.canSave)
        XCTAssertEqual(store.draft.createRequest()?.details, ["cryptoCustody": "exchange"])
        XCTAssertEqual(store.draft.details["walletAddress"], "0x1234")
    }

    func testCategoryDetailsAndNotesRoundTripWithoutLeakingHiddenDraftFields() throws {
        var matter = Matter.editorFixture
        matter.details = ["documentType": "Policy"]
        matter.notes = "Ask where the originals are kept."
        var draft = MatterDraft(matter: matter)
        XCTAssertEqual(draft.notes, matter.notes)
        XCTAssertEqual(draft.updateRequest(expectedVersion: 1)?.details, matter.details)
        draft.details["network"] = "Hidden wallet draft"
        XCTAssertNil(draft.createRequest()?.details["network"])
        draft.notes = String(repeating: "x", count: 2001)
        XCTAssertNotNil(draft.validationMessage)
        draft.notes = "  "
        XCTAssertNil(draft.createRequest()?.notes)
    }

    func testHiddenFieldsAreNeitherSubmittedNorValidationTrapsAfterTypeChange() {
        var draft = MatterDraft(firstUseCategory: .document)
        draft.title = "Document"
        draft.locationHint = "Blue folder"
        draft.accountHint = String(repeating: "x", count: 161)
        draft.valueBand = .hundredKPlus
        draft.currencyCode = "INVALID"
        XCTAssertNil(draft.validationMessage)
        XCTAssertNil(draft.createRequest()?.accountHint)
        XCTAssertNil(draft.createRequest()?.currencyCode)
        XCTAssertEqual(draft.createRequest()?.valueBand, "unknown")
        XCTAssertEqual(draft.currencyCode, "INVALID")
        draft.category = .financialAsset
        draft.institutionName = "Bank"
        XCTAssertNotNil(draft.validationMessage)
    }

    func testArchiveUsesTheLatestOptimisticVersion() async {
        let service = StubMatterService(fetch: .success(.editorFixture), update: .success(.editorFixture))
        let store = MatterEditorStore(matter: .editorFixture, service: service)

        let archivedID = await store.archive()

        XCTAssertEqual(archivedID, Matter.editorFixture.publicId)
        let archives = await service.recordedArchives()
        XCTAssertEqual(archives.first?.publicID, Matter.editorFixture.publicId)
        XCTAssertEqual(archives.first?.expectedVersion, 1)
    }
}

private actor StubMatterService: MatterEditing {
    private let fetchResult: Result<Matter, RilloraAPIError>
    private let updateResult: Result<Matter, RilloraAPIError>
    private var updates: [MatterUpdateRequest] = []
    private var creates: [MatterCreateRequest] = []
    private var archives: [(publicID: String, expectedVersion: Int)] = []

    init(
        fetch: Result<Matter, RilloraAPIError>,
        update: Result<Matter, RilloraAPIError>
    ) {
        fetchResult = fetch
        updateResult = update
    }

    func fetchMatter(publicID: String) async throws -> Matter {
        try fetchResult.get()
    }

    func updateMatter(publicID: String, request: MatterUpdateRequest) async throws -> Matter {
        updates.append(request)
        return try updateResult.get()
    }

    func createMatter(request: MatterCreateRequest) async throws -> Matter {
        creates.append(request)
        return try updateResult.get()
    }

    func archiveMatter(publicID: String, expectedVersion: Int) async throws {
        archives.append((publicID, expectedVersion))
    }

    func recordedUpdates() -> [MatterUpdateRequest] {
        updates
    }

    func recordedCreates() -> [MatterCreateRequest] {
        creates
    }

    func recordedArchives() -> [(publicID: String, expectedVersion: Int)] {
        archives
    }
}

private extension Matter {
    static var editorFixture: Matter {
        editorFixture(status: "draft", desiredOutcome: "undecided", version: 1)
    }

    static func editorFixture(status: String, desiredOutcome: String, version: Int) -> Matter {
        Matter(
            publicId: "30000000-0000-4000-8000-000000000004",
            category: "document",
            title: "Insurance",
            institutionName: "Harbor Mutual",
            accountHint: nil,
            valueBand: "unknown",
            currencyCode: nil,
            locationHint: "Blue folder",
            importance: "important",
            desiredOutcome: desiredOutcome,
            status: status,
            reviewDueAt: nil,
            version: version,
            createdAt: "2026-08-08T00:00:00.000Z",
            updatedAt: "2026-08-08T00:00:00.000Z",
            archivedAt: nil
        )
    }
}
