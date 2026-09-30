import Foundation
import Observation

enum OverviewLoadState: Equatable {
    case idle
    case loading
    case signedOut
    case loaded(OverviewSnapshot)
    case failed(message: String)
}

@MainActor
@Observable
final class OverviewStore {
    private(set) var state: OverviewLoadState = .idle
    private(set) var refreshError: String?
    private(set) var isRefreshing = false
    private let service: any OverviewServing
    private var activeReloadID: UUID?
    private var mutationRevision = 0

    init(service: any OverviewServing) {
        self.service = service
    }

    func loadIfNeeded() async {
        guard state == .idle else { return }
        await reload()
    }

    func reload() async {
        guard !isRefreshing else { return }
        let reloadID = UUID()
        let revision = mutationRevision
        activeReloadID = reloadID
        isRefreshing = true
        defer {
            if activeReloadID == reloadID { isRefreshing = false }
        }
        let previousState = state
        refreshError = nil
        if case .loaded = previousState {} else { state = .loading }
        do {
            let hasSession = try await service.hasLocalSession()
            guard activeReloadID == reloadID else { return }
            guard hasSession else {
                state = .signedOut
                return
            }
            let snapshot = try await service.fetchOverview()
            guard activeReloadID == reloadID, mutationRevision == revision else { return }
            state = .loaded(snapshot)
        } catch is CancellationError {
            if activeReloadID == reloadID, mutationRevision == revision { state = previousState }
        } catch let error as RilloraAPIError {
            guard activeReloadID == reloadID else { return }
            if error.isAuthenticationRequired {
                state = .signedOut
                return
            }
            restoreAfterRefreshFailure(message: error.localizedDescription)
        } catch {
            guard activeReloadID == reloadID else { return }
            restoreAfterRefreshFailure(message: error.localizedDescription)
        }
    }

    func reset() {
        activeReloadID = nil
        isRefreshing = false
        mutationRevision += 1
        state = .idle
        refreshError = nil
    }

    private func restoreAfterRefreshFailure(message: String) {
        if case .loaded = state {
            refreshError = message
        } else {
            state = .failed(message: message)
        }
    }

    func applySavedMatter(_ matter: Matter) {
        guard case .loaded(let snapshot) = state,
              let index = snapshot.matters.firstIndex(where: { $0.publicId == matter.publicId }) else {
            return
        }
        var matters = snapshot.matters
        matters[index] = matter
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: snapshot.plan,
                matters: matters,
                trustedContacts: snapshot.trustedContacts,
                readiness: snapshot.readiness
            )
        )
    }

    func applyCreatedMatter(_ matter: Matter) {
        guard case .loaded(let snapshot) = state else { return }
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: snapshot.plan,
                matters: snapshot.matters + [matter],
                trustedContacts: snapshot.trustedContacts,
                readiness: snapshot.readiness
            )
        )
    }

    func applyArchivedMatter(publicID: String) {
        guard case .loaded(let snapshot) = state else { return }
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: snapshot.plan,
                matters: snapshot.matters.filter { $0.publicId != publicID },
                trustedContacts: snapshot.trustedContacts,
                readiness: snapshot.readiness
            )
        )
    }

    func applyCreatedTrustedContact(_ contact: TrustedContact) {
        guard case .loaded(let snapshot) = state else { return }
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: snapshot.plan,
                matters: snapshot.matters,
                trustedContacts: snapshot.trustedContacts + [contact],
                readiness: snapshot.readiness
            )
        )
    }

    func applySavedTrustedContact(_ contact: TrustedContact) {
        guard case .loaded(let snapshot) = state,
              let index = snapshot.trustedContacts.firstIndex(where: {
                  $0.publicId == contact.publicId
              }) else {
            return
        }
        var contacts = snapshot.trustedContacts
        contacts[index] = contact
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: snapshot.plan,
                matters: snapshot.matters,
                trustedContacts: contacts,
                readiness: snapshot.readiness
            )
        )
    }

    func applySavedPlan(_ plan: Plan) {
        guard case .loaded(let snapshot) = state else { return }
        mutationRevision += 1
        state = .loaded(
            OverviewSnapshot(
                session: snapshot.session,
                plan: plan,
                matters: snapshot.matters,
                trustedContacts: snapshot.trustedContacts,
                readiness: snapshot.readiness
            )
        )
    }

    func reconcileAfterMutation() async {
        guard case .loaded = state else { return }
        let revision = mutationRevision
        do {
            let snapshot = try await service.fetchOverview()
            guard mutationRevision == revision else { return }
            state = .loaded(snapshot)
            refreshError = nil
        } catch let error as RilloraAPIError where error.isAuthenticationRequired {
            guard mutationRevision == revision else { return }
            state = .signedOut
            refreshError = nil
        } catch {
            guard mutationRevision == revision else { return }
            // Keep the confirmed mutation response visible. Pull-to-refresh remains available.
            refreshError = error.localizedDescription
        }
    }
}
