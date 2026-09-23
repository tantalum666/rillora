import Foundation
import Observation

struct RecipientRehearsalResult: Equatable, Sendable {
    let rehearsalPublicID: String
    let packagePublicID: String
    let keyPublicID: String
    let decryptedMatterCount: Int
    var keyRevoked: Bool
}

enum RecipientRehearsalState: Equatable {
    case idle
    case loading
    case passed(RecipientRehearsalResult)
    case revoking(RecipientRehearsalResult)
    case failed(message: String)
}

@MainActor
@Observable
final class RecipientRehearsalStore {
    private(set) var contacts: [TrustedContact] = []
    private(set) var state: RecipientRehearsalState = .idle
    private let service: any StartHerePreviewing
    private let encryptionService: any StartHereEncrypting
    private var sessionToken: String?
    private var deviceKey: RecipientDeviceKeyMaterial?

    init(
        service: any StartHerePreviewing,
        encryptionService: any StartHereEncrypting = CryptoKitStartHereEncryptionService()
    ) {
        self.service = service
        self.encryptionService = encryptionService
    }

    func loadContacts() async {
        do {
            contacts = try await service.recipientRehearsalContacts()
        } catch is CancellationError {
            return
        } catch {
            state = .failed(message: error.localizedDescription)
        }
    }

    func run(preview: StartHerePreview, personPublicID: String) async {
        guard state != .loading else { return }
        state = .loading
        var rehearsalPublicID: String?
        do {
            let created = try await service.createRecipientRehearsal(
                personPublicID: personPublicID
            )
            rehearsalPublicID = created.recipientRehearsal.publicId
            let accepted = try await service.acceptRecipientRehearsal(
                acceptanceToken: created.acceptanceToken
            )
            let localDeviceKey = encryptionService.createRecipientDeviceKey()
            let enrolled = try await service.enrollRecipientDeviceKey(
                sessionToken: accepted.sessionToken,
                request: RecipientDeviceKeyCreateRequest(
                    deviceLabel: "Synthetic iOS session",
                    publicKey: localDeviceKey.publicKey
                )
            )
            let preparation = try await service.prepareRecipientRehearsalPackage(
                rehearsalPublicID: created.recipientRehearsal.publicId,
                previewPublicID: preview.export.publicId
            )
            let bundle = try encryptionService.encrypt(
                preview: preview,
                preparation: preparation
            )
            try await service.finalizeRecipientRehearsalPackage(
                rehearsalPublicID: created.recipientRehearsal.publicId,
                packagePublicID: preparation.package.publicId,
                request: bundle.finalizeRequest
            )
            let artifact = try await service.fetchRecipientRehearsalPackage(
                sessionToken: accepted.sessionToken,
                packagePublicID: preparation.package.publicId
            )
            let decrypted = try encryptionService.decryptRecipient(
                artifact: artifact,
                deviceKey: localDeviceKey,
                keyPublicID: enrolled.publicId
            )
            guard decrypted == preview.package else {
                throw StartHereEncryptionError.invalidRecoveredPayload
            }
            sessionToken = accepted.sessionToken
            deviceKey = localDeviceKey
            state = .passed(RecipientRehearsalResult(
                rehearsalPublicID: created.recipientRehearsal.publicId,
                packagePublicID: preparation.package.publicId,
                keyPublicID: enrolled.publicId,
                decryptedMatterCount: decrypted.matters.count,
                keyRevoked: false
            ))
        } catch is CancellationError {
            state = .idle
        } catch {
            if let rehearsalPublicID {
                try? await service.revokeRecipientRehearsal(publicID: rehearsalPublicID)
            }
            clearSensitiveMemory()
            state = .failed(message: error.localizedDescription)
        }
    }

    func revokeKey() async {
        guard case .passed(let result) = state,
              let sessionToken else { return }
        state = .revoking(result)
        do {
            try await service.revokeRecipientDeviceKey(
                sessionToken: sessionToken,
                keyPublicID: result.keyPublicID
            )
            clearSensitiveMemory()
            var revoked = result
            revoked.keyRevoked = true
            state = .passed(revoked)
        } catch {
            state = .failed(message: error.localizedDescription)
        }
    }

    func reset() {
        clearSensitiveMemory()
        contacts = []
        state = .idle
    }

    func clearFailure() {
        if case .failed = state { state = .idle }
    }

    private func clearSensitiveMemory() {
        sessionToken = nil
        deviceKey = nil
    }
}
