import Foundation

struct APIConfiguration: Equatable, Sendable {
    let baseURL: URL
    let developmentPlannerID: String?
    let nativeAuthentication: NativeAuthenticationConfiguration?
    let serviceMarketCode: String
    let customerAccessEnabled: Bool

    init(
        baseURL: URL,
        developmentPlannerID: String?,
        nativeAuthentication: NativeAuthenticationConfiguration? = nil,
        serviceMarketCode: String = "GLOBAL_US",
        customerAccessEnabled: Bool = true
    ) {
        self.baseURL = baseURL
        self.developmentPlannerID = developmentPlannerID
        self.nativeAuthentication = nativeAuthentication
        self.serviceMarketCode = serviceMarketCode
        self.customerAccessEnabled = customerAccessEnabled
    }

    static func current(
        bundle: Bundle = .main,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) throws -> APIConfiguration {
        #if !DEBUG
        // Release credentials/endpoints must come from the reviewed bundle.
        let environment: [String: String] = [:]
        #endif
        let configuredURL = environment["RILLORA_API_BASE_URL"]
            ?? bundle.object(forInfoDictionaryKey: "RilloraAPIBaseURL") as? String
        guard let configuredURL,
              !configuredURL.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              let baseURL = URL(string: configuredURL),
              let scheme = baseURL.scheme,
              ["http", "https"].contains(scheme) else {
            throw APIConfigurationError.missingBaseURL
        }

        #if DEBUG
        let rawPlannerID = environment["RILLORA_DEV_PLANNER_ID"]
            ?? bundle.object(forInfoDictionaryKey: "RilloraDevPlannerID") as? String
        let developmentPlannerID = rawPlannerID?.trimmingCharacters(in: .whitespacesAndNewlines)
        #else
        let developmentPlannerID: String? = nil
        #endif

        let nativeAuthentication = try NativeAuthenticationConfiguration.current(
            bundle: bundle,
            environment: environment
        )

        let rawServiceMarketCode = environment["RILLORA_SERVICE_MARKET_CODE"]
            ?? bundle.object(forInfoDictionaryKey: "RilloraServiceMarketCode") as? String
        let serviceMarketCode = rawServiceMarketCode?
            .trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        guard serviceMarketCode.range(
            of: "^[A-Z][A-Z0-9_]{1,39}$",
            options: .regularExpression
        ) != nil else {
            throw APIConfigurationError.invalidServiceMarketCode
        }

        let configuredAccess = environment["RILLORA_CUSTOMER_ACCESS_ENABLED"]
            ?? bundle.object(forInfoDictionaryKey: "RilloraCustomerAccessEnabled") as? String
        let configuration = APIConfiguration(
            baseURL: baseURL,
            developmentPlannerID: developmentPlannerID?.isEmpty == false ? developmentPlannerID : nil,
            nativeAuthentication: nativeAuthentication,
            serviceMarketCode: serviceMarketCode,
            customerAccessEnabled: ["1", "true", "yes"].contains(configuredAccess?.lowercased() ?? "")
        )
        #if !DEBUG
        try configuration.validateProduction()
        #endif
        return configuration
    }

    func validateProduction() throws {
        guard baseURL.absoluteString == "https://app.rillora.xyz/api/v1",
              developmentPlannerID == nil,
              let identity = nativeAuthentication,
              identity.domain == "login.rillora.xyz",
              identity.clientID == "POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4",
              identity.audience == "urn:rillora:production:api",
              identity.sessionExchangeURL.absoluteString == "https://app.rillora.xyz/api/auth/native/session",
              !identity.appleNativeSignInEnabled,
              !identity.googleNativeSignInEnabled,
              !identity.passkeyNativeSignInEnabled else {
            throw APIConfigurationError.invalidProductionConfiguration
        }
    }
}

struct NativeAuthenticationConfiguration: Equatable, Sendable {
    var plannerAPIBaseURL: URL {
        var components = URLComponents(url: sessionExchangeURL.deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent().appendingPathComponent("v1"),
            resolvingAgainstBaseURL: false)!
        components.query = nil
        components.fragment = nil
        return components.url!
    }

    let domain: String
    let clientID: String
    let audience: String
    let sessionExchangeURL: URL
    let appleNativeSignInEnabled: Bool
    let googleNativeSignInEnabled: Bool
    let googleIOSClientID: String?
    let googleServerClientID: String?
    let passkeyNativeSignInEnabled: Bool
    /// A reviewed database connection, not a social provider or an arbitrary build value.
    let passwordResetConnection: String?

    init(
        domain: String,
        clientID: String,
        audience: String,
        sessionExchangeURL: URL,
        appleNativeSignInEnabled: Bool,
        googleNativeSignInEnabled: Bool,
        googleIOSClientID: String?,
        googleServerClientID: String?,
        passkeyNativeSignInEnabled: Bool,
        passwordResetConnection: String? = nil
    ) {
        self.domain = domain
        self.clientID = clientID
        self.audience = audience
        self.sessionExchangeURL = sessionExchangeURL
        self.appleNativeSignInEnabled = appleNativeSignInEnabled
        self.googleNativeSignInEnabled = googleNativeSignInEnabled
        self.googleIOSClientID = googleIOSClientID
        self.googleServerClientID = googleServerClientID
        self.passkeyNativeSignInEnabled = passkeyNativeSignInEnabled
        // Missing, unresolved and unreviewed settings disable only password reset.
        let connection = passwordResetConnection?.trimmingCharacters(in: .whitespacesAndNewlines)
        self.passwordResetConnection = connection == "Username-Password-Authentication" ? connection : nil
    }

    static func current(
        bundle: Bundle,
        environment: [String: String]
    ) throws -> NativeAuthenticationConfiguration? {
        let rawValues = [
            value("RILLORA_AUTH0_DOMAIN", "RilloraAuth0Domain", bundle, environment),
            value("RILLORA_AUTH0_CLIENT_ID", "RilloraAuth0ClientID", bundle, environment),
            value("RILLORA_AUTH0_AUDIENCE", "RilloraAuth0Audience", bundle, environment),
            value("RILLORA_NATIVE_SESSION_URL", "RilloraNativeSessionURL", bundle, environment),
        ]
        let values = rawValues.map {
            $0?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        }
        if values.allSatisfy({ $0.isEmpty }) { return nil }
        guard values.allSatisfy({ !$0.isEmpty }),
              let sessionExchangeURL = URL(string: values[3]),
              ["http", "https"].contains(sessionExchangeURL.scheme) else {
            throw APIConfigurationError.incompleteNativeAuthentication
        }
        let googleNativeSignInEnabled = booleanValue(
            "RILLORA_GOOGLE_NATIVE_SIGN_IN_ENABLED",
            "RilloraGoogleNativeSignInEnabled",
            bundle,
            environment
        )
        let googleIOSClientID = optionalValue(
            "RILLORA_GOOGLE_IOS_CLIENT_ID",
            "RilloraGoogleIOSClientID",
            bundle,
            environment
        )
        let googleServerClientID = optionalValue(
            "RILLORA_GOOGLE_SERVER_CLIENT_ID",
            "RilloraGoogleServerClientID",
            bundle,
            environment
        )
        if googleNativeSignInEnabled,
           googleIOSClientID == nil || googleServerClientID == nil {
            throw APIConfigurationError.incompleteNativeAuthentication
        }
        return NativeAuthenticationConfiguration(
            domain: values[0],
            clientID: values[1],
            audience: values[2],
            sessionExchangeURL: sessionExchangeURL,
            appleNativeSignInEnabled: booleanValue(
                "RILLORA_APPLE_SIGN_IN_ENABLED",
                "RilloraAppleSignInEnabled",
                bundle,
                environment
            ),
            googleNativeSignInEnabled: googleNativeSignInEnabled,
            googleIOSClientID: googleIOSClientID,
            googleServerClientID: googleServerClientID,
            passkeyNativeSignInEnabled: booleanValue(
                "RILLORA_PASSKEY_NATIVE_SIGN_IN_ENABLED",
                "RilloraPasskeyNativeSignInEnabled",
                bundle,
                environment
            ),
            passwordResetConnection: optionalValue(
                "RILLORA_PASSWORD_RESET_CONNECTION",
                "RilloraPasswordResetConnection",
                bundle,
                environment
            )
        )
    }

    private static func optionalValue(
        _ environmentKey: String,
        _ infoKey: String,
        _ bundle: Bundle,
        _ environment: [String: String]
    ) -> String? {
        let rawValue = environment[environmentKey]
            ?? bundle.object(forInfoDictionaryKey: infoKey) as? String
        let value = rawValue?.trimmingCharacters(in: .whitespacesAndNewlines)
        return value?.isEmpty == false ? value : nil
    }

    private static func booleanValue(
        _ environmentKey: String,
        _ infoKey: String,
        _ bundle: Bundle,
        _ environment: [String: String]
    ) -> Bool {
        if let rawValue = environment[environmentKey] {
            return ["1", "true", "yes"].contains(rawValue.lowercased())
        }
        if let value = bundle.object(forInfoDictionaryKey: infoKey) as? Bool {
            return value
        }
        if let rawValue = bundle.object(forInfoDictionaryKey: infoKey) as? String {
            return ["1", "true", "yes"].contains(rawValue.lowercased())
        }
        return false
    }

    private static func value(
        _ environmentKey: String,
        _ infoKey: String,
        _ bundle: Bundle,
        _ environment: [String: String]
    ) -> String? {
        environment[environmentKey] ?? bundle.object(forInfoDictionaryKey: infoKey) as? String
    }
}

enum APIConfigurationError: LocalizedError, Equatable {
    case missingBaseURL
    case incompleteNativeAuthentication
    case invalidServiceMarketCode
    case invalidProductionConfiguration

    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            String(localized: "No API endpoint is configured for this build.")
        case .incompleteNativeAuthentication:
            String(localized: "Native sign-in configuration is incomplete for this build.")
        case .invalidServiceMarketCode:
            String(localized: "No valid service market is configured for this build.")
        case .invalidProductionConfiguration:
            String(localized: "This app version cannot connect to the account service.")
        }
    }
}
