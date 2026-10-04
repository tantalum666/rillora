import XCTest
@testable import Rillora

@MainActor
final class StartHerePreviewStoreTests: XCTestCase {
    func testCreatePreviewPublishesNoFileResult() async {
        let service = StubStartHereService(result: .value(.previewFixture))
        let store = StartHerePreviewStore(service: service)

        let preview = await store.createPreview()

        XCTAssertEqual(preview, .previewFixture)
        XCTAssertEqual(store.state, .loaded(.previewFixture))
        let calls = await service.callCount()
        XCTAssertEqual(calls, 1)
    }

    func testCancellationRestoresReadyState() async {
        let service = StubStartHereService(result: .cancelled)
        let store = StartHerePreviewStore(service: service)

        let preview = await store.createPreview()

        XCTAssertNil(preview)
        XCTAssertEqual(store.state, .ready)
    }

    func testFailureCanReturnToReadyState() async {
        let service = StubStartHereService(
            result: .failure(.requestFailed("Offline"))
        )
        let store = StartHerePreviewStore(service: service)

        let preview = await store.createPreview()

        XCTAssertNil(preview)
        XCTAssertEqual(store.state, .failed(message: "Offline"))
        store.clearFailure()
        XCTAssertEqual(store.state, .ready)
    }

    func testCreatePrintablePublishesShareableInMemoryArtifact() async {
        let service = StubStartHereService(
            result: .value(.previewFixture),
            printableResult: .value(.printableFixture)
        )
        let store = StartHerePreviewStore(service: service)

        let artifact = await store.createPrintable(
            previewPublicID: "99999999-9999-4999-8999-999999999999"
        )

        XCTAssertEqual(artifact, .printableFixture)
        XCTAssertEqual(store.printableState, .loaded(.printableFixture))
        let calls = await service.printableCallCount()
        XCTAssertEqual(calls, 1)
    }

    func testPrintableCancellationRestoresIdleState() async {
        let service = StubStartHereService(
            result: .value(.previewFixture),
            printableResult: .cancelled
        )
        let store = StartHerePreviewStore(service: service)

        let artifact = await store.createPrintable(
            previewPublicID: "99999999-9999-4999-8999-999999999999"
        )

        XCTAssertNil(artifact)
        XCTAssertEqual(store.printableState, .idle)
    }

    func testCreateEncryptedPublishesOnlyAfterLocalRecoveryAndFinalize() async {
        let service = StubStartHereService(result: .value(.previewFixture))
        let store = StartHerePreviewStore(service: service)

        let bundle = await store.createEncrypted(preview: .previewFixture)

        XCTAssertNotNil(bundle)
        guard case .loaded(let loadedBundle, let record) = store.encryptedState else {
            return XCTFail("Expected a finalized encrypted package")
        }
        XCTAssertEqual(loadedBundle, bundle)
        XCTAssertEqual(record.recipientKeyCount, 0)
        XCTAssertFalse(record.serverCanDecrypt)
        let submitted = await service.submittedFinalizeRequest()
        XCTAssertEqual(submitted, bundle?.finalizeRequest)
        XCTAssertFalse(try! JSONEncoder().encode(submitted).contains(
            Data(bundle!.recoveryKit.privateKey.utf8)
        ))
    }

    func testPrintableReauthenticationKeepsPreviewAndRequiresExplicitRetry() async {
        let service = StubStartHereService(
            result: .value(.previewFixture),
            printableResult: .failure(.recentAuthenticationFixture)
        )
        let store = StartHerePreviewStore(service: service)
        let preview = await store.createPreview()

        let interrupted = await store.createPrintable(previewPublicID: preview!.export.publicId)

        XCTAssertNil(interrupted)
        XCTAssertEqual(store.state, .loaded(.previewFixture))
        XCTAssertEqual(store.printableState, .idle, "Do not present a competing generic failure alert.")
        let callsBeforeRetry = await service.printableCallCount()
        XCTAssertEqual(callsBeforeRetry, 1)

        await service.setPrintableResult(.value(.printableFixture))
        let retry = await store.createPrintable(previewPublicID: preview!.export.publicId)
        XCTAssertEqual(retry, .printableFixture)
        let callsAfterRetry = await service.printableCallCount()
        XCTAssertEqual(callsAfterRetry, 2)
    }

    func testEncryptedPreparationReauthenticationDoesNotFinalizeOrPublish() async {
        let service = StubStartHereService(result: .value(.previewFixture), preparationError: .recentAuthenticationFixture)
        let store = StartHerePreviewStore(service: service)
        _ = await store.createPreview()

        let interrupted = await store.createEncrypted(preview: .previewFixture)

        XCTAssertNil(interrupted)
        XCTAssertEqual(store.state, .loaded(.previewFixture))
        XCTAssertEqual(store.encryptedState, .idle, "The shared authentication prompt owns this recovery.")
        let submitted = await service.submittedFinalizeRequest()
        XCTAssertNil(submitted)
        let callsBeforeRetry = await service.preparationCallCount()
        XCTAssertEqual(callsBeforeRetry, 1)

        await service.clearEncryptionErrors()
        let retry = await store.createEncrypted(preview: .previewFixture)
        XCTAssertNotNil(retry)
        let callsAfterRetry = await service.preparationCallCount()
        XCTAssertEqual(callsAfterRetry, 2)
    }

    func testEncryptedFinalizeReauthenticationKeepsPreviewUntilExplicitRetry() async {
        let service = StubStartHereService(result: .value(.previewFixture), finalizationError: .recentAuthenticationFixture)
        let store = StartHerePreviewStore(service: service)
        _ = await store.createPreview()

        let interrupted = await store.createEncrypted(preview: .previewFixture)

        XCTAssertNil(interrupted)
        XCTAssertEqual(store.state, .loaded(.previewFixture))
        XCTAssertEqual(store.encryptedState, .idle, "Never publish a package before finalization succeeds.")
        let callsBeforeRetry = await service.finalizationCallCount()
        XCTAssertEqual(callsBeforeRetry, 1)

        await service.clearEncryptionErrors()
        let retry = await store.createEncrypted(preview: .previewFixture)
        XCTAssertNotNil(retry)
        guard case .loaded = store.encryptedState else { return XCTFail("Expected the explicitly retried package.") }
        let callsAfterRetry = await service.finalizationCallCount()
        XCTAssertEqual(callsAfterRetry, 2)
    }

    func testOtherForbiddenExportsStillPublishTheirFailure() async {
        let error = RilloraAPIError.server(status: 403, code: "export_not_allowed", message: "Not allowed.", requestID: nil)
        let service = StubStartHereService(result: .value(.previewFixture), printableResult: .failure(error), preparationError: error)
        let store = StartHerePreviewStore(service: service)

        _ = await store.createPrintable(previewPublicID: StartHerePreview.previewFixture.export.publicId)
        _ = await store.createEncrypted(preview: .previewFixture)

        XCTAssertEqual(store.printableState, .failed(message: "Not allowed."))
        XCTAssertEqual(store.encryptedState, .failed(message: "Not allowed."))
    }
}

private extension RilloraAPIError {
    static let recentAuthenticationFixture = RilloraAPIError.server(
        status: 403, code: "reauthentication_required", message: "Sign in again to continue.", requestID: nil
    )
}

private enum StubStartHereResult: Sendable {
    case value(StartHerePreview)
    case failure(RilloraAPIError)
    case cancelled

    func get() throws -> StartHerePreview {
        switch self {
        case .value(let preview): preview
        case .failure(let error): throw error
        case .cancelled: throw CancellationError()
        }
    }
}

private enum StubPrintableResult: Sendable {
    case value(StartHerePrintableArtifact)
    case failure(RilloraAPIError)
    case cancelled

    func get() throws -> StartHerePrintableArtifact {
        switch self {
        case .value(let artifact): artifact
        case .failure(let error): throw error
        case .cancelled: throw CancellationError()
        }
    }
}

private actor StubStartHereService: StartHerePreviewing {
    private let result: StubStartHereResult
    private var printableResult: StubPrintableResult
    private var preparationError: RilloraAPIError?
    private var finalizationError: RilloraAPIError?
    private var calls = 0
    private var printableCalls = 0
    private var preparationCalls = 0
    private var finalizationCalls = 0
    private var submittedEncryptedRequest: EncryptedStartHereFinalizeRequest?

    init(
        result: StubStartHereResult,
        printableResult: StubPrintableResult = .failure(.requestFailed("Unavailable")),
        preparationError: RilloraAPIError? = nil,
        finalizationError: RilloraAPIError? = nil
    ) {
        self.result = result
        self.printableResult = printableResult
        self.preparationError = preparationError
        self.finalizationError = finalizationError
    }

    func previewStartHere() async throws -> StartHerePreview {
        calls += 1
        return try result.get()
    }

    func callCount() -> Int {
        calls
    }

    func createPrintableStartHere(
        previewPublicID: String
    ) async throws -> StartHerePrintableArtifact {
        printableCalls += 1
        return try printableResult.get()
    }

    func printableCallCount() -> Int {
        printableCalls
    }

    func setPrintableResult(_ value: StubPrintableResult) { printableResult = value }
    func clearEncryptionErrors() { preparationError = nil; finalizationError = nil }
    func preparationCallCount() -> Int { preparationCalls }
    func finalizationCallCount() -> Int { finalizationCalls }

    func prepareEncryptedStartHere(
        previewPublicID: String
    ) async throws -> EncryptedStartHerePreparation {
        preparationCalls += 1
        if let preparationError { throw preparationError }
        return .storeFixture
    }

    func finalizeEncryptedStartHere(
        packagePublicID: String,
        request: EncryptedStartHereFinalizeRequest
    ) async throws -> EncryptedStartHereFinalizedRecord {
        submittedEncryptedRequest = request
        finalizationCalls += 1
        if let finalizationError { throw finalizationError }
        return .storeFixture
    }

    func submittedFinalizeRequest() -> EncryptedStartHereFinalizeRequest? {
        submittedEncryptedRequest
    }
}

private extension StartHerePreview {
    static let previewFixture = StartHerePreview(
        export: StartHereExportRecord(
            publicId: "99999999-9999-4999-8999-999999999999",
            createdAt: "2026-08-09T00:00:00.000Z",
            expiresAt: "2026-08-09T00:15:00.000Z",
            status: "previewed",
            encryptedPackageCreated: false
        ),
        package: StartHerePackage(
            schemaVersion: "start-here-v1",
            planner: StartHerePlanner(
                displayName: "Local Planner",
                locale: "en",
                timeZone: "Asia/Shanghai"
            ),
            plan: StartHerePlan(status: "active"),
            matters: [],
            trustedContacts: [],
            directionsNotPasswords: true,
            legalAuthorityNotGranted: true
        )
    )

}

private extension StartHerePrintableArtifact {
    static let printableFixture = StartHerePrintableArtifact(
        exportPublicId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        filename: "rillora-start-here-2026-08-10.txt",
        data: Data("RILLORA — START HERE\nRillora cannot revoke that copy\n".utf8),
        serverCopyRetained: false
    )
}

private extension EncryptedStartHerePreparation {
    static let storeFixture = EncryptedStartHerePreparation(
        package: EncryptedStartHerePreparationRecord(
            publicId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            previewPublicId: "99999999-9999-4999-8999-999999999999",
            createdAt: "2026-08-10T00:00:00.000Z",
            expiresAt: "2026-08-10T00:15:00.000Z",
            status: "generating",
            cryptoVersion: "rillora-hpke-v1",
            sourceCommitment: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            contentEncryption: "AES-256-GCM",
            keyWrapping: "HPKE-Base-P256-HKDF-SHA256-AES-256-GCM",
            serverCanDecrypt: false,
            recipientDeliveryPerformed: false
        ),
        eligibleRecipientKeys: []
    )
}

private extension EncryptedStartHereFinalizedRecord {
    static let storeFixture = EncryptedStartHereFinalizedRecord(
        publicId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        status: "ready",
        cryptoVersion: "rillora-hpke-v1",
        sourceCommitment: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        recipientKeyCount: 0,
        offlineRecoveryEnvelopeCreated: true,
        offlineRecoveryPrivateKeyReceivedByServer: false,
        recipientDeliveryPerformed: false,
        serverCanDecrypt: false,
        externalCopiesRevocable: false
    )
}
