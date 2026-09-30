import Foundation

struct APIConfiguration: Equatable, Sendable {
    let baseURL: URL
    let developmentPlannerID: String?
    let nativeAuthentication: NativeAuthenticationConfiguration?
    let serviceMarketCode: String

    init(
        baseURL: URL,
        developmentPlannerID: String?,
        nativeAuthentication: NativeAuthenticationConfiguration? = nil,
        serviceMarketCode: String = "GLOBAL_US"
    ) {
        self.baseURL = baseURL
        self.developmentPlannerID = developmentPlannerID
        self.nativeAuthentication = nativeAuthentication
        self.serviceMarketCode = serviceMarketCode
    }

    static func current(
        bundle: Bundle = .main,
        environment: [String: String] = ProcessInfo.processInfo.environment
    ) throws -> APIConfiguration {
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

        return APIConfiguration(
            baseURL: baseURL,
            developmentPlannerID: developmentPlannerID?.isEmpty == false ? developmentPlannerID : nil,
            nativeAuthentication: nativeAuthentication,
            serviceMarketCode: serviceMarketCode
        )
    }
}

struct NativeAuthenticationConfiguration: Equatable, Sendable {
    let domain: String
    let clientID: String
    let audience: String
    let sessionExchangeURL: URL
    let appleNativeSignInEnabled: Bool
    let googleNativeSignInEnabled: Bool
    let googleIOSClientID: String?
    let googleServerClientID: String?
    let passkeyNativeSignInEnabled: Bool

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

    var errorDescription: String? {
        switch self {
        case .missingBaseURL:
            "No API endpoint is configured for this build."
        case .incompleteNativeAuthentication:
            "Native sign-in configuration is incomplete for this build."
        case .invalidServiceMarketCode:
            "No valid service market is configured for this build."
        }
    }
}
