import Foundation
import Observation

enum StartHerePreviewState: Equatable {
    case ready
    case loading
    case loaded(StartHerePreview)
    case failed(message: String)
}

enum StartHerePrintableState: Equatable {
    case idle
    case loading
    case loaded(StartHerePrintableArtifact)
    case failed(message: String)
}

enum StartHereEncryptedState: Equatable {
    case idle
    case loading
    case loaded(bundle: EncryptedStartHereBundle, record: EncryptedStartHereFinalizedRecord)
    case failed(message: String)
}

@MainActor
@Observable
final class StartHerePreviewStore {
    private(set) var state: StartHerePreviewState = .ready
    private(set) var printableState: StartHerePrintableState = .idle
    private(set) var encryptedState: StartHereEncryptedState = .idle
    private let service: any StartHerePreviewing
    private let encryptionService: any StartHereEncrypting
    private(set) var recipients: [SharingConnection] = []
    private(set) var recipientError: String?

    init(
        service: any StartHerePreviewing,
        encryptionService: any StartHereEncrypting = CryptoKitStartHereEncryptionService()
    ) {
        self.service = service
        self.encryptionService = encryptionService
    }

    func loadRecipients() async {
        do { recipients = try await service.exportRecipients(); recipientError = nil }
        catch { recipientError = "Connected people could not be loaded. Try again." }
    }

    func resetPreview() {
        state = .ready; printableState = .idle; encryptedState = .idle
    }

    func createPreview(recipientConnectionPublicID: String? = nil) async -> StartHerePreview? {
        guard state != .loading else { return nil }
        let previousState = state
        state = .loading
        do {
            let preview = try await service.previewStartHere(recipientConnectionPublicID: recipientConnectionPublicID)
            state = .loaded(preview)
            printableState = .idle
            encryptedState = .idle
            return preview
        } catch is CancellationError {
            state = previousState
            return nil
        } catch let error as RilloraAPIError {
            state = error.isReauthenticationRequired ? previousState : .failed(message: error.localizedDescription)
            return nil
        } catch {
            state = .failed(message: error.localizedDescription)
            return nil
        }
    }

    func createEncrypted(preview: StartHerePreview) async -> EncryptedStartHereBundle? {
        guard encryptedState != .loading else { return nil }
        let previousState = encryptedState
        encryptedState = .loading
        do {
            let preparation = try await service.prepareEncryptedStartHere(
                previewPublicID: preview.export.publicId
            )
            let bundle = try encryptionService.encrypt(
                preview: preview,
                preparation: preparation
            )
            let finalized = try await service.finalizeEncryptedStartHere(
                packagePublicID: preparation.package.publicId,
                request: bundle.finalizeRequest
            )
            encryptedState = .loaded(bundle: bundle, record: finalized)
            return bundle
        } catch is CancellationError {
            encryptedState = previousState
            return nil
        } catch let error as RilloraAPIError {
            // The API client presents the shared sign-in prompt. A generic error
            // alert here can hide it; retain this context for an explicit retry.
            encryptedState = error.isReauthenticationRequired ? previousState : .failed(message: error.localizedDescription)
            return nil
        } catch {
            encryptedState = .failed(message: error.localizedDescription)
            return nil
        }
    }

    func createPrintable(previewPublicID: String) async -> StartHerePrintableArtifact? {
        guard printableState != .loading else { return nil }
        let previousState = printableState
        printableState = .loading
        do {
            let artifact = try await service.createPrintableStartHere(
                previewPublicID: previewPublicID
            )
            printableState = .loaded(artifact)
            return artifact
        } catch is CancellationError {
            printableState = previousState
            return nil
        } catch let error as RilloraAPIError {
            printableState = error.isReauthenticationRequired ? previousState : .failed(message: error.localizedDescription)
            return nil
        } catch {
            printableState = .failed(message: error.localizedDescription)
            return nil
        }
    }

    func clearFailure() {
        if case .failed = state {
            state = .ready
        }
        if case .failed = printableState {
            printableState = .idle
        }
        if case .failed = encryptedState {
            encryptedState = .idle
        }
    }
}
