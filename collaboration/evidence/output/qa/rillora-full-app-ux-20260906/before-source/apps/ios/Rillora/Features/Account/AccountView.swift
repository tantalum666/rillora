import SwiftUI

struct ProfileView: View {
    let store: OverviewStore
    let authenticationStore: AuthenticationStore
    let commerceStore: CommerceStore
    let planService: any PlanEditing
    let trustedContactService: any TrustedContactEditing
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let startHereService: any StartHerePreviewing
    let onOpenFirstUseGuide: () -> Void
    let onAuthenticate: () -> Void

    @State private var presentedContact: ContactSheetDestination?

    var body: some View {
        Group {
            switch store.state {
            case .idle, .loading:
                OverviewLoadingView()
            case .signedOut:
                SignedOutProfileView(
                    isAuthenticating: authenticationStore.isWorking,
                    onAuthenticate: onAuthenticate
                )
            case .failed(let message):
                OverviewFailureView(
                    message: message,
                    retry: { Task { await store.reload() } }
                )
            case .loaded(let snapshot):
                AuthenticatedProfileContent(
                    snapshot: snapshot,
                    store: store,
                    planService: planService,
                    officialSetupService: officialSetupService,
                    simulationService: simulationService,
                    disclosureRehearsalService: disclosureRehearsalService,
                    startHereService: startHereService,
                    authenticationStore: authenticationStore,
                    commerceStore: commerceStore,
                    onOpenFirstUseGuide: onOpenFirstUseGuide,
                    addContact: { presentedContact = .create },
                    editContact: { presentedContact = .edit($0) }
                )
                .refreshable {
                    await store.reload()
                }
            }
        }
        .navigationTitle("Profile")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $presentedContact) { destination in
            NavigationStack {
                switch destination {
                case .create:
                    TrustedContactEditorView(
                        contact: nil,
                        service: trustedContactService,
                        overviewStore: store
                    )
                case .edit(let contact):
                    TrustedContactEditorView(
                        contact: contact,
                        service: trustedContactService,
                        overviewStore: store
                    )
                }
            }
        }
    }
}

private enum ContactSheetDestination: Identifiable {
    case create
    case edit(TrustedContact)

    var id: String {
        switch self {
        case .create: "create"
        case .edit(let contact): "edit-\(contact.publicId)"
        }
    }
}
