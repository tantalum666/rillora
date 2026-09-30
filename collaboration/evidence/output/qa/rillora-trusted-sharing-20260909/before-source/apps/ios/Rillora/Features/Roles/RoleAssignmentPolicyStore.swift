import Foundation
import Observation

enum RoleAssignmentPolicyState: Equatable {
    case idle
    case loading
    case loaded
    case working
    case failed(message: String, conflict: Bool)
}

@MainActor
@Observable
final class RoleAssignmentPolicyStore {
    private(set) var state: RoleAssignmentPolicyState = .idle
    private(set) var assignments: [RoleAssignment] = []
    private(set) var notice: String?

    private let service: any RoleAssignmentEditing

    init(service: any RoleAssignmentEditing) {
        self.service = service
    }

    var isBusy: Bool {
        state == .loading || state == .working
    }

    func assignments(applyingTo matterPublicID: String) -> [RoleAssignment] {
        assignments.filter {
            $0.scope == .planWide || $0.matter?.publicId == matterPublicID
        }
    }

    func loadIfNeeded() async {
        guard state == .idle else { return }
        await reload()
    }

    func reload() async {
        let previousState = state
        state = .loading
        do {
            assignments = try await service.fetchRoleAssignments()
            state = .loaded
        } catch is CancellationError {
            state = previousState
        } catch let error as RilloraAPIError {
            state = .failed(message: error.localizedDescription, conflict: error.isVersionConflict)
        } catch {
            state = .failed(message: error.localizedDescription, conflict: false)
        }
    }

    func create(
        personPublicID: String,
        role: RoleAssignmentRole,
        scope: RoleAssignmentScope,
        matterPublicID: String
    ) async -> Bool {
        guard role != .recipient || scope == .matterSpecific else { return false }
        return await mutate {
            try await service.createRoleAssignment(request: RoleAssignmentCreateRequest(
                personPublicId: personPublicID,
                role: role,
                scope: scope,
                matterPublicId: scope == .matterSpecific ? matterPublicID : nil
            ))
        }
    }

    func update(
        assignment: RoleAssignment,
        role: RoleAssignmentRole,
        scope: RoleAssignmentScope,
        matterPublicID: String
    ) async -> Bool {
        guard assignment.editable,
              role != .recipient || scope == .matterSpecific else { return false }
        return await mutate {
            try await service.updateRoleAssignment(
                publicID: assignment.publicId,
                request: RoleAssignmentUpdateRequest(
                    expectedVersion: assignment.version,
                    role: role,
                    scope: scope,
                    matterPublicId: scope == .matterSpecific ? matterPublicID : nil
                )
            )
        }
    }

    func revoke(_ assignment: RoleAssignment) async -> Bool {
        await mutate {
            try await service.revokeRoleAssignment(
                publicID: assignment.publicId,
                expectedVersion: assignment.version
            )
        }
    }

    func clearFailure() {
        if case .failed = state { state = .loaded }
    }

    func clearNotice() {
        notice = nil
    }

    private func mutate(
        _ operation: () async throws -> RoleAssignmentMutationResult
    ) async -> Bool {
        let previousAssignments = assignments
        state = .working
        notice = nil
        do {
            let result = try await operation()
            assignments = try await service.fetchRoleAssignments()
            notice = result.invalidatedDisclosureRehearsalCount > 0
                ? "Role policy saved. Earlier disclosure rehearsals are now stale."
                : "Role policy saved. No invitation or authority was created."
            state = .loaded
            return true
        } catch is CancellationError {
            assignments = previousAssignments
            state = .loaded
            return false
        } catch let error as RilloraAPIError {
            assignments = previousAssignments
            state = .failed(message: error.localizedDescription, conflict: error.isVersionConflict)
            return false
        } catch {
            assignments = previousAssignments
            state = .failed(message: error.localizedDescription, conflict: false)
            return false
        }
    }
}
