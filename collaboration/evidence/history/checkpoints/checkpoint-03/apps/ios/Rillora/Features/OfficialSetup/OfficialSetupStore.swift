import Foundation
import Observation

enum OfficialSetupLoadState: Equatable {
    case idle
    case loading
    case loaded([OfficialSetupCheck])
    case failed(message: String, authenticationRequired: Bool)
}

struct OfficialSetupMutationFailure: Equatable, Identifiable {
    let publicID: String
    let message: String
    let conflict: Bool

    var id: String { publicID }
}

@MainActor
@Observable
final class OfficialSetupStore {
    private(set) var state: OfficialSetupLoadState = .idle
    private(set) var pendingValues: [String: Bool] = [:]
    private(set) var mutationFailure: OfficialSetupMutationFailure?

    private let service: any OfficialSetupEditing

    init(service: any OfficialSetupEditing) {
        self.service = service
    }

    var checks: [OfficialSetupCheck] {
        guard case .loaded(let checks) = state else { return [] }
        return checks
    }

    func displayedCompleted(for check: OfficialSetupCheck) -> Bool {
        pendingValues[check.publicId] ?? check.completed
    }

    func isSaving(_ check: OfficialSetupCheck) -> Bool {
        pendingValues[check.publicId] != nil
    }

    func loadIfNeeded() async {
        guard state == .idle else { return }
        await reload()
    }

    func reload() async {
        let previousState = state
        state = .loading
        do {
            state = .loaded(try await service.fetchOfficialSetupChecks())
        } catch is CancellationError {
            state = previousState
        } catch let error as RilloraAPIError {
            state = .failed(
                message: error.localizedDescription,
                authenticationRequired: error.isAuthenticationRequired
            )
        } catch {
            state = .failed(message: error.localizedDescription, authenticationRequired: false)
        }
    }

    @discardableResult
    func setCompleted(publicID: String, completed: Bool) async -> OfficialSetupCheck? {
        guard case .loaded(let currentChecks) = state,
              let check = currentChecks.first(where: { $0.publicId == publicID }),
              pendingValues[publicID] == nil,
              check.completed != completed else {
            return nil
        }

        pendingValues[publicID] = completed
        defer { pendingValues[publicID] = nil }

        do {
            let saved = try await service.updateOfficialSetupCheck(
                publicID: publicID,
                request: OfficialSetupCheckUpdateRequest(
                    expectedVersion: check.version,
                    completed: completed
                )
            )
            guard case .loaded(var latestChecks) = state,
                  let index = latestChecks.firstIndex(where: { $0.publicId == publicID }) else {
                return saved
            }
            latestChecks[index] = saved
            state = .loaded(latestChecks)
            return saved
        } catch is CancellationError {
            return nil
        } catch let error as RilloraAPIError {
            mutationFailure = OfficialSetupMutationFailure(
                publicID: publicID,
                message: error.localizedDescription,
                conflict: error.isVersionConflict
            )
            return nil
        } catch {
            mutationFailure = OfficialSetupMutationFailure(
                publicID: publicID,
                message: error.localizedDescription,
                conflict: false
            )
            return nil
        }
    }

    func clearMutationFailure() {
        mutationFailure = nil
    }
}
