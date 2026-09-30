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
    let sharingService: any SharingServing
    let maintenanceService: any FamilyMaintenanceServing
    @State private var selectedTab: AppTab = .overview
    @State private var firstUseDestination: FirstUseSheetDestination?
    @State private var shouldPauseGuideOnDismiss = false
    @State private var firstUseError: String?
    @State private var overviewMatter: Matter?
    @State private var invitationSheet: ReceivedInvitation?
    @State private var queuedInvitation: ReceivedInvitation?
    @State private var contactSheetOpen = false
    @State private var lastPlannerID: String?

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
                    onAddFirstMatter: { presentFirstUse(.newMatter(.account)) },
                    onOpenFirstUseGuide: { presentFirstUse(.guide) },
                    onPauseFirstUse: { plan in
                        Task { await pauseFirstUse(plan: plan) }
                    },
                    onStartPrivatePlan: { beginAuthentication(then: .newMatter(.account)) }
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
                    onAuthenticate: { category in beginAuthentication(then: .newMatter(category)) }
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
                    sharingService: sharingService,
                    maintenanceService: maintenanceService,
                    onOpenFirstUseGuide: { presentFirstUse(.guide) },
                    onAuthenticate: { beginAuthentication() },
                    onOpenInvitation: { queueInvitation(nil) },
                    onContactPresentationChanged: { shown in contactSheetOpen = shown; if !shown { presentQueuedInvitation() } }
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
            defer { presentQueuedInvitation() }
            guard shouldPauseGuideOnDismiss else { return }
            shouldPauseGuideOnDismiss = false
            Task { await pauseInProgressGuideIfNeeded() }
        }) { destination in
            NavigationStack {
                firstUseSheet(destination)
            }
            .presentationBackground(RilloraTheme.graphite)
        }
        .sheet(item: $invitationSheet, onDismiss: { presentQueuedInvitation() }) { received in
            NavigationStack { InvitationAcceptView(initialToken: received.token, service: sharingService, authenticationStore: authenticationStore, overviewStore: store) }
                .presentationBackground(RilloraTheme.graphite)
        }
        .onOpenURL { url in
            if let token = ReceivedInvitation.token(from: url.absoluteString) { queueInvitation(token) }
        }
        .onChange(of: authenticationStore.isWorking) { _, working in if !working { presentQueuedInvitation() } }
        .onChange(of: activePlannerID) { _, next in
            guard let next else { return }
            if let lastPlannerID, lastPlannerID != next { overviewMatter = nil; firstUseDestination = nil }
            lastPlannerID = next
        }
        .task {
            await store.loadIfNeeded()
            #if DEBUG
            if let token = ProcessInfo.processInfo.environment["RILLORA_UI_TEST_INVITATION_TOKEN"],
               token.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil {
                queueInvitation(token)
            }
            #endif
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
    private var activePlannerID: String? { if case .loaded(let snapshot) = store.state { snapshot.session.plannerPublicId } else { nil } }
    private func queueInvitation(_ token: String?) { queuedInvitation = ReceivedInvitation(token: token); presentQueuedInvitation() }
    private func presentQueuedInvitation() {
        guard let queuedInvitation, invitationSheet == nil, firstUseDestination == nil, !contactSheetOpen, !authenticationStore.isWorking else { return }
        selectedTab = .profile; invitationSheet = queuedInvitation; self.queuedInvitation = nil
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
            case .newMatter(let category):
                MatterEditorView(
                    matter: nil,
                    initialDraft: MatterDraft(firstUseCategory: category),
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
            beginAuthentication(then: destination)
            return
        }
        shouldPauseGuideOnDismiss = destination == .guide
        firstUseDestination = destination
    }

    private func beginAuthentication(then destination: FirstUseSheetDestination? = nil) {
        guard !authenticationStore.isWorking else { return }
        authenticationStore.errorMessage = nil
        Task {
            if await authenticationStore.signIn() {
                if let destination {
                    presentFirstUse(destination)
                } else {
                    selectedTab = .overview
                }
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

private enum FirstUseSheetDestination: Identifiable, Equatable {
    case guide
    case newMatter(MatterCategory)

    var id: String {
        switch self {
        case .guide: "guide"
        case .newMatter(let category): "new-matter-\(category.rawValue)"
        }
    }
}
