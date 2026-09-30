import Foundation
import Observation

enum PlanMotivationEditorState: Equatable {
    case loading
    case ready
    case saving
    case failed(message: String, conflict: Bool)
}

@MainActor
@Observable
final class PlanMotivationStore {
    private(set) var state: PlanMotivationEditorState = .ready
    private(set) var source: Plan
    var selection: PlanMotivation?

    private let service: any PlanEditing
    private var hasLoadedLatest = false

    init(plan: Plan, service: any PlanEditing) {
        source = plan
        selection = plan.motivation.flatMap(PlanMotivation.init(rawValue:))
        self.service = service
    }

    var canSave: Bool {
        guard state == .ready, let selection else { return false }
        return selection.rawValue != source.motivation
    }

    var isBusy: Bool {
        state == .loading || state == .saving
    }

    func loadLatestIfNeeded() async {
        guard !hasLoadedLatest else { return }
        await loadLatest()
    }

    func loadLatest() async {
        let previousState = state
        state = .loading
        do {
            apply(try await service.fetchPlan())
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

    func save() async -> Plan? {
        guard state == .ready, let selection else { return nil }
        state = .saving
        do {
            let saved = try await service.updatePlan(
                request: PlanUpdateRequest(
                    expectedVersion: source.version,
                    motivation: selection
                )
            )
            apply(saved)
            state = .ready
            return saved
        } catch is CancellationError {
            state = .ready
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

    private func apply(_ plan: Plan) {
        source = plan
        selection = plan.motivation.flatMap(PlanMotivation.init(rawValue:))
    }
}
