import Foundation
import Observation

struct MatterDraft: Equatable, Sendable {
    var title: String
    var category: MatterCategory
    var institutionName: String
    var accountHint: String
    var valueBand: MatterValueBand
    var currencyCode: String
    var locationHint: String
    var importance: MatterImportance
    var desiredOutcome: MatterOutcome
    var status: MatterStatus
    var details: [String: String] = [:]
    var notes = ""

    init() {
        title = ""
        category = .account
        institutionName = ""
        accountHint = ""
        valueBand = .unknown
        currencyCode = ""
        locationHint = ""
        importance = .important
        desiredOutcome = .undecided
        status = .draft
    }

    init(firstUseCategory category: MatterCategory) {
        self.init()
        self.category = category
    }

    init(matter: Matter) {
        details = matter.details ?? [:]
        notes = matter.notes ?? ""
        title = matter.title
        category = MatterCategory(rawValue: matter.category) ?? .account
        institutionName = matter.institutionName ?? ""
        accountHint = matter.accountHint ?? ""
        valueBand = MatterValueBand(rawValue: matter.valueBand) ?? .unknown
        currencyCode = matter.currencyCode ?? ""
        locationHint = matter.locationHint ?? ""
        importance = MatterImportance(rawValue: matter.importance) ?? .important
        desiredOutcome = MatterOutcome(rawValue: matter.desiredOutcome) ?? .undecided
        status = MatterStatus(rawValue: matter.status) ?? .draft
    }

    var validationMessage: String? {
        let cleanTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        if cleanTitle.isEmpty { return "Add a short name for this matter." }
        if cleanTitle.count > 120 { return "The matter name must be 120 characters or fewer." }
        if showsProvider && institutionName.count > 160 { return "The institution must be 160 characters or fewer." }
        if showsAccountHint && accountHint.count > 160 { return "The account hint must be 160 characters or fewer." }
        if locationHint.count > 500 { return "The location note must be 500 characters or fewer." }

        let cleanCurrency = currencyCode.trimmingCharacters(in: .whitespacesAndNewlines)
        if category.hasValue, !cleanCurrency.isEmpty,
           cleanCurrency.range(of: "^[A-Za-z]{3}$", options: .regularExpression) == nil {
            return "Use a three-letter currency code such as USD or EUR."
        }
        return detailValidationMessage
    }

    func updateRequest(expectedVersion: Int) -> MatterUpdateRequest? {
        guard validationMessage == nil else { return nil }
        return MatterUpdateRequest(
            expectedVersion: expectedVersion,
            category: category.rawValue,
            title: title.trimmed,
            institutionName: showsProvider ? institutionName.nilIfBlank : nil,
            accountHint: showsAccountHint ? accountHint.nilIfBlank : nil,
            valueBand: category.hasValue ? valueBand.rawValue : "unknown",
            currencyCode: category.hasValue ? currencyCode.nilIfBlank?.uppercased() : nil,
            locationHint: locationHint.nilIfBlank,
            importance: importance.rawValue,
            desiredOutcome: desiredOutcome.rawValue,
            status: status.rawValue,
            details: applicableDetails,
            notes: notes.nilIfBlank
        )
    }

    func createRequest() -> MatterCreateRequest? {
        guard validationMessage == nil else { return nil }
        return MatterCreateRequest(
            category: category.rawValue,
            title: title.trimmed,
            institutionName: showsProvider ? institutionName.nilIfBlank : nil,
            accountHint: showsAccountHint ? accountHint.nilIfBlank : nil,
            valueBand: category.hasValue ? valueBand.rawValue : "unknown",
            currencyCode: category.hasValue ? currencyCode.nilIfBlank?.uppercased() : nil,
            locationHint: locationHint.nilIfBlank,
            importance: importance.rawValue,
            desiredOutcome: desiredOutcome.rawValue,
            status: status.rawValue,
            details: applicableDetails,
            notes: notes.nilIfBlank
        )
    }
}

enum MatterEditorState: Equatable {
    case ready
    case loading
    case saving
    case archiving
    case failed(message: String, conflict: Bool)
}

@MainActor
@Observable
final class MatterEditorStore {
    private(set) var state: MatterEditorState = .ready
    private(set) var source: Matter?
    var draft: MatterDraft

    private let service: any MatterEditing
    private let originalDraft: MatterDraft
    private var hasLoadedLatest = false

    init(matter: Matter?, initialDraft: MatterDraft? = nil, service: any MatterEditing) {
        source = matter
        let startingDraft = matter.map { MatterDraft(matter: $0) } ?? initialDraft ?? MatterDraft()
        draft = startingDraft
        originalDraft = startingDraft
        self.service = service
        hasLoadedLatest = matter == nil
    }

    var isBusy: Bool {
        state == .loading || state == .saving || state == .archiving
    }

    var isNew: Bool {
        source == nil
    }

    var canSave: Bool {
        guard !isBusy, draft.validationMessage == nil else { return false }
        guard let source else { return true }
        return draft != MatterDraft(matter: source)
    }

    var hasUnsavedChanges: Bool {
        draft != (source.map(MatterDraft.init(matter:)) ?? originalDraft)
    }

    var visibleValidationMessage: String? {
        if isNew && draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
            return nil
        }
        return draft.validationMessage
    }

    func loadLatestIfNeeded() async {
        guard !hasLoadedLatest else { return }
        await loadLatest()
    }

    func loadLatest() async {
        guard let source else { return }
        let previousState = state
        state = .loading
        do {
            apply(try await service.fetchMatter(publicID: source.publicId))
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

    func save() async -> Matter? {
        guard draft.validationMessage == nil else {
            state = .failed(
                message: draft.validationMessage ?? "Review this matter before saving.",
                conflict: false
            )
            return nil
        }

        let previousState = state
        state = .saving
        do {
            let saved: Matter
            if let source {
                guard let request = draft.updateRequest(expectedVersion: source.version) else {
                    state = previousState
                    return nil
                }
                saved = try await service.updateMatter(publicID: source.publicId, request: request)
            } else {
                guard let request = draft.createRequest() else {
                    state = previousState
                    return nil
                }
                saved = try await service.createMatter(request: request)
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

    func archive() async -> String? {
        guard let source else { return nil }
        let previousState = state
        state = .archiving
        do {
            try await service.archiveMatter(
                publicID: source.publicId,
                expectedVersion: source.version
            )
            state = .ready
            return source.publicId
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

    private func apply(_ matter: Matter) {
        source = matter
        draft = MatterDraft(matter: matter)
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
