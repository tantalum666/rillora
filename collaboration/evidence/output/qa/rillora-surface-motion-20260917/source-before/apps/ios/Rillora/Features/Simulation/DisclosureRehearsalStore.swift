import Foundation
import Observation

enum DisclosureRehearsalPhase: Equatable {
    case idle
    case working
    case loaded
    case failed(message: String)
}

@MainActor
@Observable
final class DisclosureRehearsalStore {
    private(set) var phase: DisclosureRehearsalPhase = .idle
    private(set) var rehearsal: DisclosureRehearsal?
    var selectedLifeEvent: LifeEvent = .death

    private let service: any DisclosureRehearsing

    init(service: any DisclosureRehearsing) {
        self.service = service
    }

    var isWorking: Bool {
        phase == .working
    }

    @discardableResult
    func create() async -> DisclosureRehearsal? {
        guard !isWorking else { return nil }
        let previousPhase = phase
        phase = .working
        do {
            let created = try await service.createDisclosureRehearsal(
                request: DisclosureRehearsalCreateRequest(lifeEvent: selectedLifeEvent)
            )
            rehearsal = created
            phase = .loaded
            return created
        } catch is CancellationError {
            phase = previousPhase
            return nil
        } catch {
            phase = .failed(message: error.localizedDescription)
            return nil
        }
    }

    @discardableResult
    func perform(_ action: DisclosureRehearsalAction) async -> DisclosureRehearsal? {
        guard !isWorking,
              let current = rehearsal,
              current.availableActions.contains(action) else {
            return nil
        }
        let previousPhase = phase
        phase = .working
        do {
            let updated = try await service.updateDisclosureRehearsal(
                publicID: current.publicId,
                request: DisclosureRehearsalActionRequest(
                    expectedVersion: current.version,
                    action: action
                )
            )
            rehearsal = updated
            phase = .loaded
            return updated
        } catch is CancellationError {
            phase = previousPhase
            return nil
        } catch {
            phase = .failed(message: error.localizedDescription)
            return nil
        }
    }

    func startSeparateEvent() {
        guard !isWorking else { return }
        rehearsal = nil
        phase = .idle
    }

    func clearFailure() {
        guard case .failed = phase else { return }
        phase = rehearsal == nil ? .idle : .loaded
    }
}
