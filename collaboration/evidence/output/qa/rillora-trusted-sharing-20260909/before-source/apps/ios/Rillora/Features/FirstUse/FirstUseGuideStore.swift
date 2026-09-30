import Foundation
import Observation

enum FirstUseGuideEditorState: Equatable {
    case ready
    case saving
    case failed(message: String, conflict: Bool)
}

@MainActor
@Observable
final class FirstUseGuideStore {
    private(set) var state: FirstUseGuideEditorState = .ready
    private(set) var source: Plan
    var step: Int
    var motivation: PlanMotivation?
    var category: MatterCategory = .account

    private let service: any PlanEditing

    init(plan: Plan, service: any PlanEditing) {
        source = plan
        step = max(plan.firstUseStep, 1)
        motivation = plan.motivation.flatMap(PlanMotivation.init(rawValue:))
        self.service = service
    }

    var isBusy: Bool { state == .saving }

    func startIfNeeded() async -> Plan? {
        guard source.firstUseState != .guideInProgress || source.firstUseStep == 0 else {
            return nil
        }
        return await update(state: .guideInProgress, step: max(step, 1))
    }

    func continueToMatter() async -> Plan? {
        await update(
            state: .guideInProgress,
            step: 2,
            motivation: motivation
        )
    }

    func pause() async -> Plan? {
        await update(state: .guidePaused, step: min(max(step, 0), 2))
    }

    func clearFailure() {
        if case .failed = state { state = .ready }
    }

    private func update(
        state firstUseState: FirstUseState,
        step firstUseStep: Int,
        motivation: PlanMotivation? = nil
    ) async -> Plan? {
        let previousState = state
        state = .saving
        do {
            let saved = try await service.updatePlan(
                request: PlanUpdateRequest(
                    expectedVersion: source.version,
                    motivation: motivation,
                    firstUseState: firstUseState,
                    firstUseStep: firstUseStep
                )
            )
            source = saved
            step = max(saved.firstUseStep, firstUseStep)
            self.motivation = saved.motivation.flatMap(PlanMotivation.init(rawValue:))
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
}
