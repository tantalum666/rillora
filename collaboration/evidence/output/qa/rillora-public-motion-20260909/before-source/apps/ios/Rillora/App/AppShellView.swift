import SwiftUI

struct AppShellView: View {
    let store: OverviewStore
    let authenticationStore: AuthenticationStore
    let commerceStore: CommerceStore
    let planService: any PlanEditing
    let matterService: any MatterEditing
    let trustedContactService: any TrustedContactEditing
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let roleAssignmentService: any RoleAssignmentEditing
    let startHereService: any StartHerePreviewing
    @State private var selectedTab: AppTab = .overview
    @State private var firstUseDestination: FirstUseSheetDestination?
    @State private var shouldPauseGuideOnDismiss = false
    @State private var firstUseError: String?
    @State private var overviewMatter: Matter?

    var body: some View {
        if commerceStore.storeKitSandboxCatalogTestingEnabled {
            NavigationStack {
                StoreKitSandboxCatalogView(store: commerceStore)
            }
            .preferredColorScheme(.dark)
        } else {
            TabView(selection: $selectedTab) {
            NavigationStack {
                OverviewView(
                    store: store,
                    onReviewMatters: { selectedTab = .matters },
                    onOpenMatter: { overviewMatter = $0 },
                    onOpenProfile: { selectedTab = .profile },
                    onAddFirstMatter: { presentFirstUse(.newMatter) },
                    onOpenFirstUseGuide: { presentFirstUse(.guide) },
                    onPauseFirstUse: { plan in
                        Task { await pauseFirstUse(plan: plan) }
                    },
                    onStartPrivatePlan: beginAuthentication
                )
                .navigationDestination(isPresented: Binding(
                    get: { overviewMatter != nil },
                    set: { if !$0 { overviewMatter = nil } }
                )) {
                    if let matter = overviewMatter, case .loaded(let snapshot) = store.state {
                        MatterEditorView(
                            matter: matter,
                            service: matterService,
                            roleAssignmentService: roleAssignmentService,
                            contacts: snapshot.trustedContacts,
                            overviewStore: store
                        )
                    }
                }
            }
            .tabItem { AppTab.overview.label(isSelected: selectedTab == .overview) }
            .tag(AppTab.overview)

            NavigationStack {
                MattersView(
                    store: store,
                    matterService: matterService,
                    roleAssignmentService: roleAssignmentService,
                    onAuthenticate: beginAuthentication
                )
            }
            .tabItem { AppTab.matters.label(isSelected: selectedTab == .matters) }
            .tag(AppTab.matters)

            NavigationStack {
                ProfileView(
                    store: store,
                    authenticationStore: authenticationStore,
                    commerceStore: commerceStore,
                    planService: planService,
                    trustedContactService: trustedContactService,
                    officialSetupService: officialSetupService,
                    simulationService: simulationService,
                    disclosureRehearsalService: disclosureRehearsalService,
                    startHereService: startHereService,
                    onOpenFirstUseGuide: { presentFirstUse(.guide) },
                    onAuthenticate: beginAuthentication
                )
            }
            .tabItem { AppTab.profile.label(isSelected: selectedTab == .profile) }
            .tag(AppTab.profile)
        }
        .tint(RilloraTheme.tabSelection)
        .toolbarBackground(
            RilloraTheme.graphiteSurface,
            for: .tabBar
        )
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.dark, for: .tabBar)
        .preferredColorScheme(.dark)
        .sheet(item: $firstUseDestination, onDismiss: {
            guard shouldPauseGuideOnDismiss else { return }
            shouldPauseGuideOnDismiss = false
            Task { await pauseInProgressGuideIfNeeded() }
        }) { destination in
            NavigationStack {
                firstUseSheet(destination)
            }
            .presentationBackground(RilloraTheme.graphite)
        }
        .task {
            await store.loadIfNeeded()
        }
        .task(id: commerceAppAccountToken) {
            guard let commerceAppAccountToken else { return }
            await commerceStore.start(appAccountToken: commerceAppAccountToken)
        }
        .alert(
            "Account action couldn’t be completed",
            isPresented: Binding(
                get: { authenticationStore.errorMessage != nil },
                set: { if !$0 { authenticationStore.errorMessage = nil } }
            )
        ) {
            Button("OK", role: .cancel) {
                authenticationStore.errorMessage = nil
            }
        } message: {
            Text(authenticationStore.errorMessage ?? "Please try again.")
        }
        .alert(
            "Setup couldn’t be saved",
            isPresented: Binding(
                get: { firstUseError != nil },
                set: { if !$0 { firstUseError = nil } }
            )
        ) {
            Button("OK", role: .cancel) { firstUseError = nil }
        } message: {
            Text(firstUseError ?? "Please try again.")
        }
        }
    }

    private var commerceAppAccountToken: UUID? {
        guard case .loaded(let snapshot) = store.state else { return nil }
        return UUID(uuidString: snapshot.session.plannerPublicId)
    }

    @ViewBuilder
    private func firstUseSheet(_ destination: FirstUseSheetDestination) -> some View {
        if case .loaded(let snapshot) = store.state {
            switch destination {
            case .guide:
                FirstUseGuideView(
                    plan: snapshot.plan,
                    planService: planService,
                    matterService: matterService,
                    roleAssignmentService: roleAssignmentService,
                    contacts: snapshot.trustedContacts,
                    overviewStore: store
                )
            case .newMatter:
                MatterEditorView(
                    matter: nil,
                    service: matterService,
                    roleAssignmentService: roleAssignmentService,
                    contacts: snapshot.trustedContacts,
                    overviewStore: store
                )
            }
        } else {
            ProgressView("Loading your plan…")
        }
    }

    private func presentFirstUse(_ destination: FirstUseSheetDestination) {
        guard case .loaded = store.state else {
            beginAuthentication()
            return
        }
        shouldPauseGuideOnDismiss = destination == .guide
        firstUseDestination = destination
    }

    private func beginAuthentication() {
        guard !authenticationStore.isWorking else { return }
        authenticationStore.errorMessage = nil
        Task {
            if await authenticationStore.signIn() {
                selectedTab = .overview
            }
        }
    }

    private func pauseFirstUse(plan: Plan) async {
        do {
            let saved = try await planService.updatePlan(
                request: PlanUpdateRequest(
                    expectedVersion: plan.version,
                    firstUseState: .guidePaused,
                    firstUseStep: min(max(plan.firstUseStep, 0), 2)
                )
            )
            store.applySavedPlan(saved)
        } catch {
            firstUseError = error.localizedDescription
        }
    }

    private func pauseInProgressGuideIfNeeded() async {
        guard case .loaded(let snapshot) = store.state,
              snapshot.plan.firstUseState == .guideInProgress else { return }
        await pauseFirstUse(plan: snapshot.plan)
    }
}

private enum FirstUseSheetDestination: String, Identifiable {
    case guide
    case newMatter

    var id: String { rawValue }
}
