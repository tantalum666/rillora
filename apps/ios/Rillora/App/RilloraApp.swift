import GoogleSignIn
import SwiftUI
import UIKit

@main
struct RilloraApp: App {
    @Environment(\.scenePhase) private var scenePhase
    @State private var overviewStore: OverviewStore
    @State private var authenticationStore: AuthenticationStore
    @State private var commerceStore: CommerceStore
    private let matterService: any MatterEditing
    private let planService: any PlanEditing
    private let trustedContactService: any TrustedContactEditing
    private let officialSetupService: any OfficialSetupEditing
    private let simulationService: any SimulationRunning
    private let disclosureRehearsalService: any DisclosureRehearsing
    private let roleAssignmentService: any RoleAssignmentEditing
    private let startHereService: any StartHerePreviewing
    private let sharingService: any SharingServing
    private let maintenanceService: any FamilyMaintenanceServing

    init() {
        AppAppearance.migratePreference()
        RilloraNavigationAppearance.install()
        let dependencies = AppDependencies.current()
        let overviewStore = OverviewStore(service: dependencies.overviewService)
        let commerceStore = CommerceStore(
            service: dependencies.commerceService,
            storefrontProvider: dependencies.storefrontProvider,
            storeKitClient: dependencies.storeKitClient,
            storeKitTestEnvironment: dependencies.storeKitTestEnvironment,
            storeKitTestAppAccountToken: dependencies.storeKitTestAppAccountToken,
            serviceMarketCode: dependencies.serviceMarketCode,
            storeKitProductionEnabled: dependencies.storeKitProductionEnabled
        )
        _overviewStore = State(initialValue: overviewStore)
        _commerceStore = State(initialValue: commerceStore)
        _authenticationStore = State(
            initialValue: AuthenticationStore(
                service: dependencies.authenticationService,
                overviewStore: overviewStore,
                commerceStore: commerceStore
            )
        )
        matterService = dependencies.matterService
        planService = dependencies.planService
        trustedContactService = dependencies.trustedContactService
        officialSetupService = dependencies.officialSetupService
        simulationService = dependencies.simulationService
        disclosureRehearsalService = dependencies.disclosureRehearsalService
        roleAssignmentService = dependencies.roleAssignmentService
        startHereService = dependencies.startHereService
        sharingService = dependencies.sharingService
        maintenanceService = dependencies.maintenanceService
    }

    var body: some Scene {
        WindowGroup {
            AppShellView(
                store: overviewStore,
                authenticationStore: authenticationStore,
                commerceStore: commerceStore,
                planService: planService,
                matterService: matterService,
                trustedContactService: trustedContactService,
                officialSetupService: officialSetupService,
                simulationService: simulationService,
                disclosureRehearsalService: disclosureRehearsalService,
                roleAssignmentService: roleAssignmentService,
                startHereService: startHereService,
                sharingService: sharingService,
                maintenanceService: maintenanceService
            )
            .background(RilloraTheme.canvas)
            #if DEBUG
            .modifier(RilloraUITestAccessibilityOverrides())
            .onChange(of: scenePhase, initial: true) { _, phase in
                // Explicit geometry for layout tests when Simulator motion events
                // do not update the scene. Ordinary launches keep system rotation.
                guard phase == .active,
                      ProcessInfo.processInfo.environment["RILLORA_UI_TEST_LANDSCAPE"] == "1",
                      let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene else { return }
                scene.requestGeometryUpdate(.iOS(interfaceOrientations: .landscapeLeft))
            }
            #endif
            .onOpenURL { url in
                let configuration = try? APIConfiguration.current()
                if NativeAuthenticationCallback.isEnabledGoogleCallback(url, configuration: configuration?.nativeAuthentication) {
                    _ = GIDSignIn.sharedInstance.handle(url)
                }
            }
        }
    }
}
