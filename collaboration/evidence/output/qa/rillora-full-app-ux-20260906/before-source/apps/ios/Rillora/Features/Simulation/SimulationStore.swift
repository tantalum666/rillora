import Foundation
import Observation

enum SimulationRunState: Equatable {
    case ready
    case running
    case completed(ClaimSimulation)
    case failed(message: String)
}

@MainActor
@Observable
final class SimulationStore {
    private(set) var state: SimulationRunState = .ready
    var selectedLifeEvent: LifeEvent = .death

    private let service: any SimulationRunning

    init(service: any SimulationRunning) {
        self.service = service
    }

    var isRunning: Bool {
        state == .running
    }

    func run() async -> ClaimSimulation? {
        guard !isRunning else { return nil }
        let previousState = state
        state = .running
        do {
            let simulation = try await service.runSimulation(
                request: ClaimSimulationCreateRequest(lifeEvent: selectedLifeEvent)
            )
            state = .completed(simulation)
            return simulation
        } catch is CancellationError {
            state = previousState
            return nil
        } catch let error as RilloraAPIError {
            state = .failed(message: error.localizedDescription)
            return nil
        } catch {
            state = .failed(message: error.localizedDescription)
            return nil
        }
    }

    func reset() {
        state = .ready
    }

    func clearFailure() {
        if case .failed = state {
            state = .ready
        }
    }
}
