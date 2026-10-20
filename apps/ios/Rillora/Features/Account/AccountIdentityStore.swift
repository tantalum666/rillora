import Foundation
import Observation

/// Memory-only and account-bound. A late result from another session cannot
/// repaint Profile; navigating away cancels publication without touching auth.
@MainActor
@Observable
final class AccountIdentityStore {
    enum State: Equatable {
        case idle
        case loading
        case loaded(AccountIdentityResponse)
        case unavailable
        case authenticationRequired
    }

    private(set) var state: State = .idle
    private(set) var plannerPublicID: String?
    private var generation = 0

    func identity(for expectedID: String) -> AccountIdentityResponse? {
        guard plannerPublicID == expectedID, case .loaded(let result) = state,
              result.belongs(to: expectedID) else { return nil }
        return result
    }

    func load(plannerPublicID expectedID: String, service: (any AccountIdentityServing)?, force: Bool = false) async {
        if plannerPublicID == expectedID, !force {
            if case .loaded = state { return }
            if state == .loading { return }
        }
        generation += 1
        let requestGeneration = generation
        plannerPublicID = expectedID
        state = .loading
        guard UUID(uuidString: expectedID) != nil, let service else {
            state = .unavailable
            return
        }
        do {
            let result = try await service.fetchAccountIdentity()
            guard !Task.isCancelled, requestGeneration == generation,
                  plannerPublicID == expectedID else { return }
            guard result.belongs(to: expectedID) else {
                state = .authenticationRequired
                return
            }
            state = .loaded(result)
        } catch {
            guard !Task.isCancelled, requestGeneration == generation,
                  plannerPublicID == expectedID else { return }
            if let apiError = error as? RilloraAPIError, apiError.isAuthenticationRequired {
                state = .authenticationRequired
            } else {
                state = .unavailable
            }
        }
    }

    func cancelPendingLoad() {
        generation += 1
        if state == .loading { state = .idle }
    }

    func clear() {
        generation += 1
        plannerPublicID = nil
        state = .idle
    }
}
