import SwiftUI
#if RILLORA_CHECKIN_NEXT_VERSION
import RilloraCheckInKit
#endif

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
    @State private var peopleIntent: ProfilePeopleIntent?
    @State private var sharingRevision = 0
    @State private var overviewShared = false
    @State private var queuedApplePurchase = false
    @State private var showsApplePurchase = false
    @AppStorage(AppAppearance.storageKey) private var appearanceValue = AppAppearance.system.rawValue
    @Environment(\.colorScheme) private var colorScheme
    #if RILLORA_CHECKIN_NEXT_VERSION
    @Environment(CheckInPhoneStore.self) private var checkInStore
    #endif

    var body: some View {
        if commerceStore.storeKitSandboxCatalogTestingEnabled {
            NavigationStack {
                StoreKitSandboxCatalogView(store: commerceStore)
            }
            .preferredColorScheme(appearancePreference.colorScheme)
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
                    onStartPrivatePlan: { beginAuthentication(then: .newMatter(.account)) },
                    onSignIn: { beginAuthentication() },
                    onOpenInvitation: { invitationSheet = ReceivedInvitation(token: nil) },
                    isAuthenticating: authenticationStore.isWorking,
                    sharingService: sharingService,
                    sharingRevision: sharingRevision,
                    onInviteSomeone: { selectedTab = .profile; peopleIntent = ProfilePeopleIntent() },
                    onOpenShared: { overviewShared = true },
                    onOpenContact: { selectedTab = .profile; peopleIntent = ProfilePeopleIntent(contact: $0) }
                )
                .navigationDestination(isPresented: $overviewShared) {
                    SharedWithMeView(service: sharingService, onOpenInvitation: { queueInvitation(nil) })
                }
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
            .id("overview-" + (activePlannerID ?? "public"))
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
            .id("matters-" + (activePlannerID ?? "public"))
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
                    onContactPresentationChanged: { shown in contactSheetOpen = shown; if !shown { sharingRevision += 1; presentQueuedInvitation() } },
                    peopleIntent: $peopleIntent
                )
            }
            .id("profile-" + (activePlannerID ?? "public"))
            .tabItem { AppTab.profile.label(isSelected: selectedTab == .profile) }
            .tag(AppTab.profile)
        }
        .tint(RilloraTheme.tabSelection)
        #if RILLORA_CHECKIN_NEXT_VERSION
        .onChange(of: store.state, initial: true) { _, state in
            switch state {
            case .loaded(let snapshot): Task { await checkInStore.activate(accountID: snapshot.session.plannerPublicId) }
            case .signedOut: checkInStore.deactivate()
            default: checkInStore.temporarilyUnavailable()
            }
        }
        .sheet(isPresented: Binding(get: { checkInStore.showReminder }, set: { checkInStore.showReminder = $0 })) {
            NavigationStack { CheckInPhoneView(store: checkInStore).toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Close") { checkInStore.showReminder = false } }
            } }
        }
        #endif
        .toolbarBackground(
            RilloraTheme.graphiteSurface,
            for: .tabBar
        )
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(resolvedAppearance, for: .tabBar)
        .preferredColorScheme(appearancePreference.colorScheme)
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
            .preferredColorScheme(appearancePreference.colorScheme)
        }
        .sheet(isPresented: $showsApplePurchase, onDismiss: { presentQueuedInvitation() }) {
            ApplePurchaseEntryView(store: store, authentication: authenticationStore, commerce: commerceStore)
                .preferredColorScheme(appearancePreference.colorScheme)
        }
        .sheet(item: $invitationSheet, onDismiss: { presentQueuedInvitation() }) { received in
            NavigationStack {
                if received.isFuture, let token = received.token,
                   let service = sharingService as? any FutureNoticeServing, service.futureNoticesEnabled {
                    FutureNoticeInvitationView(token: token, service: service, authenticationStore: authenticationStore, overviewStore: store)
                } else {
                    InvitationAcceptView(initialToken: received.token, service: sharingService, authenticationStore: authenticationStore, overviewStore: store)
                }
            }
                .presentationBackground(RilloraTheme.graphite)
                .preferredColorScheme(appearancePreference.colorScheme)
        }
        .sheet(item: Binding(get: { authenticationStore.deletionReference }, set: { authenticationStore.deletionReference = $0 })) { reference in
            if let dataService = startHereService as? any AccountDataServing {
                NavigationStack {
                    AccountDeletionStatusView(service: dataService, initialReference: reference)
                        .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Close") { authenticationStore.deletionReference = nil } } }
                }.presentationBackground(RilloraTheme.graphite)
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .rilloraReauthenticationRequired)) { _ in
            Task { await NativeReauthenticationPrompt.present(using: authenticationStore) }
        }
        .onChange(of: authenticationStore.deletionReference?.id) { _, value in
            if value != nil { showsApplePurchase = false; queuedApplePurchase = false; firstUseDestination = nil; shouldPauseGuideOnDismiss = false; overviewMatter = nil; overviewShared = false; invitationSheet = nil; queuedInvitation = nil; peopleIntent = nil; selectedTab = .profile }
        }
        .onOpenURL { url in
            openInvitationURL(url)
        }
        .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
            if let url = activity.webpageURL { openInvitationURL(url) }
        }
        .onChange(of: authenticationStore.isWorking) { _, working in if !working { presentQueuedInvitation() } }
        .onChange(of: activePlannerID) { _, next in
            guard let next else {
                if !authenticationStore.isWorking { overviewShared = false; peopleIntent = nil }
                return
            }
            if let lastPlannerID, lastPlannerID != next { overviewMatter = nil; firstUseDestination = nil; peopleIntent = nil; overviewShared = false }
            lastPlannerID = next
        }
        .task {
            await store.loadIfNeeded()
            #if DEBUG
            if let value = ProcessInfo.processInfo.environment["RILLORA_UI_TEST_FUTURE_INVITATION_URL"],
               let url = URL(string: value) { openInvitationURL(url) }
            if let token = ProcessInfo.processInfo.environment["RILLORA_UI_TEST_INVITATION_TOKEN"],
               token.range(of: "^[A-Za-z0-9_-]{43}$", options: .regularExpression) != nil {
                queueInvitation(token)
            }
            #endif
        }
        .task {
            for await productID in commerceStore.purchaseIntents() {
                guard !Task.isCancelled else { return }
                guard productID == RilloraStoreKitCatalog.familyAnnualProductID else { continue }
                queuedApplePurchase = true
                presentQueuedInvitation()
            }
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
            Text(authenticationStore.errorMessage ?? String(localized: "Please try again."))
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
            Text(firstUseError ?? String(localized: "Please try again."))
        }
        }
    }

    private var commerceAppAccountToken: UUID? {
        guard case .loaded(let snapshot) = store.state else { return nil }
        return UUID(uuidString: snapshot.session.plannerPublicId)
    }
    private var appearancePreference: AppAppearance {
        AppAppearance(rawValue: appearanceValue) ?? .system
    }
    private var resolvedAppearance: ColorScheme { appearancePreference.colorScheme ?? colorScheme }
    private var activePlannerID: String? { if case .loaded(let snapshot) = store.state { snapshot.session.plannerPublicId } else { nil } }
    private func queueInvitation(_ token: String?, isFuture: Bool = false) { queuedInvitation = ReceivedInvitation(token: token, isFuture: isFuture); presentQueuedInvitation() }
    private func openInvitationURL(_ url: URL) {
        if let service = sharingService as? any FutureNoticeServing, service.futureNoticesEnabled,
           let token = FutureNoticeLink.token(from: url.absoluteString) { queueInvitation(token, isFuture: true) }
        else if let token = ReceivedInvitation.token(from: url.absoluteString) { queueInvitation(token) }
    }
    private func presentQueuedInvitation() {
        if queuedInvitation == nil, queuedApplePurchase, invitationSheet == nil,
           firstUseDestination == nil, !contactSheetOpen, !authenticationStore.isWorking,
           authenticationStore.deletionReference == nil {
            queuedApplePurchase = false; showsApplePurchase = true
        }
        guard !showsApplePurchase else { return }
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
