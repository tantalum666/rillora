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
    private let service: any OverviewServing

    init(service: any OverviewServing) {
        self.service = service
    }

    func loadIfNeeded() async {
        guard state == .idle else { return }
        await reload()
    }

    func reload() async {
        let previousState = state
        state = .loading
        do {
            guard try await service.hasLocalSession() else {
                state = .signedOut
                return
            }
            state = .loaded(try await service.fetchOverview())
        } catch is CancellationError {
            state = previousState
        } catch let error as RilloraAPIError {
            if error.isAuthenticationRequired {
                state = .signedOut
                return
            }
            state = .failed(message: error.localizedDescription)
        } catch {
            state = .failed(message: error.localizedDescription)
        }
    }

    func reset() {
        state = .idle
    }

    func applySavedMatter(_ matter: Matter) {
        guard case .loaded(let snapshot) = state,
              let index = snapshot.matters.firstIndex(where: { $0.publicId == matter.publicId }) else {
            return
        }
        var matters = snapshot.matters
        matters[index] = matter
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
        do {
            state = .loaded(try await service.fetchOverview())
        } catch {
            // Keep the confirmed mutation response visible. Pull-to-refresh remains available.
        }
    }
}
