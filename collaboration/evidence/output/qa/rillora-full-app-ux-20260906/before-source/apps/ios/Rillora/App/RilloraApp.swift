import GoogleSignIn
import SwiftUI

@main
struct RilloraApp: App {
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

    init() {
        RilloraNavigationAppearance.install()
        let dependencies = AppDependencies.current()
        let overviewStore = OverviewStore(service: dependencies.overviewService)
        let commerceStore = CommerceStore(
            service: dependencies.commerceService,
            storefrontProvider: dependencies.storefrontProvider,
            storeKitClient: dependencies.storeKitClient,
            storeKitTestEnvironment: dependencies.storeKitTestEnvironment,
            storeKitTestAppAccountToken: dependencies.storeKitTestAppAccountToken,
            serviceMarketCode: dependencies.serviceMarketCode
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
                startHereService: startHereService
            )
            .onOpenURL { url in
                _ = GIDSignIn.sharedInstance.handle(url)
            }
        }
    }
}
