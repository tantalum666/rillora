import Foundation

struct AppDependencies {
    let overviewService: any OverviewServing
    let planService: any PlanEditing
    let matterService: any MatterEditing
    let trustedContactService: any TrustedContactEditing
    let officialSetupService: any OfficialSetupEditing
    let simulationService: any SimulationRunning
    let disclosureRehearsalService: any DisclosureRehearsing
    let roleAssignmentService: any RoleAssignmentEditing
    let startHereService: any StartHerePreviewing
    let authenticationService: any NativeAuthenticating
    let commerceService: any CommerceServing
    let storefrontProvider: any CommerceStorefrontProviding
    let storeKitClient: any StoreKitPurchasing
    let storeKitTestEnvironment: RilloraStoreKitTestEnvironment
    let storeKitTestAppAccountToken: UUID?
    let serviceMarketCode: String

    @MainActor
    static func current() -> AppDependencies {
        do {
            let configuration = try APIConfiguration.current()
            #if DEBUG
            let forcesSignedOutTestState = ProcessInfo.processInfo.environment["RILLORA_UI_TEST_FORCE_SIGNED_OUT"] == "1"
            let tokenStore: any SessionTokenStore = forcesSignedOutTestState
                ? VolatileSessionTokenStore()
                : KeychainSessionTokenStore()
            #else
            let tokenStore: any SessionTokenStore = KeychainSessionTokenStore()
            #endif
            let client = APIClient(
                configuration: configuration,
                sessionTokenStore: tokenStore
            )
            #if DEBUG
            let overviewService: any OverviewServing = forcesSignedOutTestState
                && ProcessInfo.processInfo.environment["RILLORA_UI_TEST_EXPIRED_SESSION"] == "1"
                ? ExpiredSessionOverviewFixture()
                : client
            #else
            let overviewService: any OverviewServing = client
            #endif
            let authenticationService: any NativeAuthenticating =
                if let nativeAuthentication = configuration.nativeAuthentication {
                    Auth0NativeAuthenticationService(
                        configuration: nativeAuthentication,
                        tokenStore: tokenStore
                    )
                } else {
                    UnavailableNativeAuthenticationService()
                }
            let storeKitTestEnvironment = Self.storeKitTestEnvironment
            let storeKitClient: any StoreKitPurchasing =
                if let subscriptionGroupID = storeKitTestEnvironment.subscriptionGroupID {
                    AppleStoreKitClient(expectedSubscriptionGroupID: subscriptionGroupID)
                } else {
                    UnavailableStoreKitClient()
                }
            return AppDependencies(
                overviewService: overviewService,
                planService: client,
                matterService: client,
                trustedContactService: client,
                officialSetupService: client,
                simulationService: client,
                disclosureRehearsalService: client,
                roleAssignmentService: client,
                startHereService: client,
                authenticationService: authenticationService,
                commerceService: client,
                storefrontProvider: AppleStorefrontProvider(),
                storeKitClient: storeKitClient,
                storeKitTestEnvironment: storeKitTestEnvironment,
                storeKitTestAppAccountToken: configuration.developmentPlannerID
                    .flatMap(UUID.init(uuidString:)),
                serviceMarketCode: configuration.serviceMarketCode
            )
        } catch {
            let message = error.localizedDescription
            return AppDependencies(
                overviewService: UnavailableOverviewService(message: message),
                planService: UnavailablePlanService(message: message),
                matterService: UnavailableMatterService(message: message),
                trustedContactService: UnavailableTrustedContactService(message: message),
                officialSetupService: UnavailableOfficialSetupService(message: message),
                simulationService: UnavailableSimulationService(message: message),
                disclosureRehearsalService: UnavailableDisclosureRehearsalService(message: message),
                roleAssignmentService: UnavailableRoleAssignmentService(message: message),
                startHereService: UnavailableStartHereService(message: message),
                authenticationService: UnavailableNativeAuthenticationService(),
                commerceService: UnavailableCommerceService(message: message),
                storefrontProvider: UnavailableStorefrontProvider(),
                storeKitClient: UnavailableStoreKitClient(),
                storeKitTestEnvironment: .disabled,
                storeKitTestAppAccountToken: nil,
                serviceMarketCode: "UNAVAILABLE"
            )
        }
    }

    private static var storeKitTestEnvironment: RilloraStoreKitTestEnvironment {
        #if DEBUG
        let environment = ProcessInfo.processInfo.environment
        let localEnabled = environment["RILLORA_STOREKIT_LOCAL_TESTING"] == "1"
        let sandboxCatalogEnabled =
            environment["RILLORA_STOREKIT_SANDBOX_CATALOG_TESTING"] == "1"
        let sandboxPurchaseEnabled =
            environment["RILLORA_STOREKIT_SANDBOX_PURCHASE_TESTING"] == "1"
        let enabledCount = [
            localEnabled,
            sandboxCatalogEnabled,
            sandboxPurchaseEnabled,
        ].filter { $0 }.count
        guard enabledCount == 1 else { return .disabled }
        if localEnabled { return .xcodeLocal }
        return sandboxPurchaseEnabled
            ? .appStoreSandboxPurchase
            : .appStoreSandboxCatalog
        #else
        .disabled
        #endif
    }
}
