import Foundation
import Observation

struct TrustedContactDraft: Equatable, Sendable {
    var displayName: String
    var relationshipLabel: String

    init() {
        displayName = ""
        relationshipLabel = ""
    }

    init(contact: TrustedContact) {
        displayName = contact.displayName
        relationshipLabel = contact.relationshipLabel ?? ""
    }

    var validationMessage: String? {
        let cleanName = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanName.isEmpty { return "Add the contact’s name." }
        if cleanName.count > 120 { return "The contact name must be 120 characters or fewer." }
        if relationshipLabel.count > 120 {
            return "The relationship must be 120 characters or fewer."
        }
        return nil
    }

    func createRequest() -> TrustedContactCreateRequest? {
        guard validationMessage == nil else { return nil }
        return TrustedContactCreateRequest(
            displayName: displayName.trimmed,
            relationshipLabel: relationshipLabel.nilIfBlank
        )
    }

    func updateRequest(expectedVersion: Int, status: String? = nil) -> TrustedContactUpdateRequest? {
        guard validationMessage == nil else { return nil }
        return TrustedContactUpdateRequest(
            expectedVersion: expectedVersion,
            displayName: displayName.trimmed,
            relationshipLabel: relationshipLabel.nilIfBlank,
            status: status
        )
    }
}

enum TrustedContactEditorState: Equatable {
    case ready
    case loading
    case saving
    case revoking
    case failed(message: String, conflict: Bool)
}

@MainActor
@Observable
final class TrustedContactEditorStore {
    private(set) var state: TrustedContactEditorState = .ready
    private(set) var source: TrustedContact?
    var draft: TrustedContactDraft

    private let service: any TrustedContactEditing
    private var hasLoadedLatest = false

    init(contact: TrustedContact?, service: any TrustedContactEditing) {
        source = contact
        draft = contact.map(TrustedContactDraft.init(contact:)) ?? TrustedContactDraft()
        self.service = service
        hasLoadedLatest = contact == nil
    }

    var isBusy: Bool {
        state == .loading || state == .saving || state == .revoking
    }

    var isNew: Bool {
        source == nil
    }

    var canSave: Bool {
        guard !isBusy, draft.validationMessage == nil else { return false }
        guard let source else { return true }
        return draft != TrustedContactDraft(contact: source)
    }

    var hasUnsavedChanges: Bool {
        draft != (source.map(TrustedContactDraft.init(contact:)) ?? TrustedContactDraft())
    }

    var canRevoke: Bool {
        guard !isBusy, let source else { return false }
        return !source.isRevoked
    }

    var visibleValidationMessage: String? {
        if isNew && draft.displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return nil
        }
        return draft.validationMessage
    }

    func loadLatestIfNeeded() async {
        guard !hasLoadedLatest else { return }
        await loadLatest()
    }

    func loadLatest() async {
        guard !isBusy, let source else { return }
        let previousState = state
        state = .loading
        do {
            let contacts = try await service.fetchTrustedContacts()
            guard let latest = contacts.first(where: { $0.publicId == source.publicId }) else {
                throw RilloraAPIError.requestFailed(
                    "This trusted-contact record is no longer available."
                )
            }
            apply(latest)
            hasLoadedLatest = true
            state = .ready
        } catch is CancellationError {
            state = previousState
        } catch let error as RilloraAPIError {
            state = .failed(message: error.localizedDescription, conflict: error.isVersionConflict)
        } catch {
            state = .failed(message: error.localizedDescription, conflict: false)
        }
    }

    func save() async -> TrustedContact? {
        guard !isBusy else { return nil }
        guard draft.validationMessage == nil else {
            state = .failed(
                message: draft.validationMessage ?? "Review this contact before saving.",
                conflict: false
            )
            return nil
        }

        let previousState = state
        state = .saving
        do {
            let saved: TrustedContact
            if let source {
                guard let request = draft.updateRequest(expectedVersion: source.version) else {
                    state = previousState
                    return nil
                }
                saved = try await service.updateTrustedContact(
                    publicID: source.publicId,
                    request: request
                )
            } else {
                guard let request = draft.createRequest() else {
                    state = previousState
                    return nil
                }
                saved = try await service.createTrustedContact(request: request)
            }
            apply(saved)
            state = .ready
            return saved
        } catch is CancellationError {
            state = previousState
            return nil
        } catch let error as RilloraAPIError {
            state = .failed(message: error.localizedDescription, conflict: error.isVersionConflict)
            return nil
        } catch {
            state = .failed(message: error.localizedDescription, conflict: false)
            return nil
        }
    }

    func revoke() async -> TrustedContact? {
        guard !isBusy, let source else { return nil }
        let previousState = state
        state = .revoking
        do {
            let revoked = try await service.updateTrustedContact(
                publicID: source.publicId,
                request: TrustedContactUpdateRequest(
                    expectedVersion: source.version,
                    displayName: source.displayName,
                    relationshipLabel: source.relationshipLabel,
                    status: "revoked"
                )
            )
            apply(revoked)
            state = .ready
            return revoked
        } catch is CancellationError {
            state = previousState
            return nil
        } catch let error as RilloraAPIError {
            state = .failed(message: error.localizedDescription, conflict: error.isVersionConflict)
            return nil
        } catch {
            state = .failed(message: error.localizedDescription, conflict: false)
            return nil
        }
    }

    func clearFailure() {
        if case .failed = state {
            state = .ready
        }
    }

    private func apply(_ contact: TrustedContact) {
        source = contact
        draft = TrustedContactDraft(contact: contact)
    }
}

private extension String {
    var trimmed: String {
        trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var nilIfBlank: String? {
        let value = trimmed
        return value.isEmpty ? nil : value
    }
}
