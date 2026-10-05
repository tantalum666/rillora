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
    let sharingService: any SharingServing
    let maintenanceService: any FamilyMaintenanceServing
    let onOpenFirstUseGuide: () -> Void
    let onAuthenticate: () -> Void
    let onOpenInvitation: () -> Void
    let onContactPresentationChanged: (Bool) -> Void
    @Binding var peopleIntent: ProfilePeopleIntent?

    @State private var presentedContact: ContactSheetDestination?
    @State private var sharingRevision = 0
    @State private var lastKnownPlannerID: String?

    var body: some View {
        Group {
            switch store.state {
            case .idle, .loading:
                OverviewLoadingView()
            case .signedOut:
                SignedOutProfileView(
                    isAuthenticating: authenticationStore.isWorking,
                    requiresSignInAgain: store.requiresSignInAgain,
                    onAuthenticate: onAuthenticate,
                    onOpenInvitation: onOpenInvitation,
                    deletionService: startHereService as? any AccountDataServing
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
                    sharingService: sharingService,
                    maintenanceService: maintenanceService,
                    sharingRevision: sharingRevision,
                    authenticationStore: authenticationStore,
                    commerceStore: commerceStore,
                    onOpenFirstUseGuide: onOpenFirstUseGuide,
                    onOpenInvitation: onOpenInvitation,
                    addContact: { presentedContact = .create },
                    editContact: { presentedContact = .share($0) }
                )
                .refreshable {
                    await store.reload()
                }
            }
        }
        .rilloraRefreshStatus(store)
        .onChange(of: peopleIntent?.id, initial: true) { _, next in
            guard next != nil, let intent = peopleIntent, currentPlannerID != nil else { return }
            presentedContact = intent.contact.map { .share($0) } ?? .create
            peopleIntent = nil
        }
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                AppLanguageButton()
                AppAppearanceMenu()
            }
        }
        .navigationTitle(String(localized: "Profile"))
        .navigationBarTitleDisplayMode(.inline)
        .sheet(item: $presentedContact) { destination in
            NavigationStack {
                switch destination {
                case .create:
                    TrustedContactEditorView(
                        contact: nil,
                        service: trustedContactService,
                        overviewStore: store,
                        onCreated: { presentedContact = .share($0) }
                    )
                case .edit(let contact):
                    TrustedContactEditorView(
                        contact: contact,
                        service: trustedContactService,
                        overviewStore: store
                    )
                case .share(let contact):
                    ContactSharingView(contact: contact, matters: currentMatters, service: sharingService,
                                       contactService: trustedContactService, overviewStore: store)
                }
            }
        }
        .onChange(of: presentedContact != nil, initial: true) { _, shown in
            onContactPresentationChanged(shown)
            if !shown { sharingRevision += 1 }
        }
        .onChange(of: currentPlannerID, initial: true) { _, next in
            if let next {
                if let lastKnownPlannerID, lastKnownPlannerID != next { presentedContact = nil }
                lastKnownPlannerID = next
            } else if !authenticationStore.isWorking { presentedContact = nil }
        }
    }
    private var currentMatters: [Matter] { if case .loaded(let snapshot) = store.state { snapshot.matters } else { [] } }
    private var currentPlannerID: String? { if case .loaded(let snapshot) = store.state { snapshot.session.plannerPublicId } else { nil } }
}

struct ProfilePeopleIntent: Identifiable {
    let id = UUID()
    var contact: TrustedContact? = nil
}

private enum ContactSheetDestination: Identifiable {
    case create
    case edit(TrustedContact)
    case share(TrustedContact)

    var id: String {
        switch self {
        case .create: "create"
        case .edit(let contact): "edit-\(contact.publicId)"
        case .share(let contact): "share-\(contact.publicId)"
        }
    }
}
