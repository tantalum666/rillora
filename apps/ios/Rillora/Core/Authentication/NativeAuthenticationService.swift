import Auth0
import AuthenticationServices
import Foundation
import GoogleSignIn
import UIKit

@MainActor
protocol NativeAuthenticating: PasswordResetRequesting {
    var isConfigured: Bool { get }
    var canSignInWithApple: Bool { get }
    var canSignInWithGoogle: Bool { get }
    var canSignInWithPasskey: Bool { get }
    func signIn(
        intent: NativeAuthenticationIntent,
        loginHint: String?
    ) async throws
    func signInWithApple(
        authorizationCode: String,
        fullName: PersonNameComponents?,
        legalAcceptance: LegalAcceptanceProof
    ) async throws
    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async throws
    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async throws
    func takeInitialOverview() -> OverviewSnapshot?
    func signOut() async
    func clearLocalSession() async
    func signOutAll() async throws
}

extension NativeAuthenticating {
    var canResetPassword: Bool { false }
    func requestPasswordReset(email: String) async throws { throw PasswordResetError.unavailable }

    func clearLocalSession() async { await signOut() }
    func takeInitialOverview() -> OverviewSnapshot? { nil }
}

enum NativeAuthenticationIntent: Sendable, Equatable {
    case signIn
    case createAccount
    case reauthenticate
    case google
}

@MainActor
final class Auth0NativeAuthenticationService: NativeAuthenticating {
    nonisolated static let googleSubjectTokenType =
        "http://auth0.com/oauth/token-type/google-id-token"

    let isConfigured = true
    var canSignInWithApple: Bool { configuration.appleNativeSignInEnabled }
    var canSignInWithGoogle: Bool {
        configuration.googleNativeSignInEnabled
            && configuration.googleIOSClientID != nil
            && configuration.googleServerClientID != nil
    }
    var canSignInWithPasskey: Bool { configuration.passkeyNativeSignInEnabled }
    var canResetPassword: Bool { configuration.passwordResetConnection != nil }

    private let configuration: NativeAuthenticationConfiguration
    private let tokenStore: any SessionTokenStore
    private let session: URLSession
    private let passkeyAuthorization = PasskeyAuthorizationBroker()
    private var initialOverview: OverviewSnapshot?

    func takeInitialOverview() -> OverviewSnapshot? {
        defer { initialOverview = nil }
        // A partial exchange payload must go through APIClient's complete hydration.
        guard initialOverview?.nextCursor == nil else { return nil }
        return initialOverview
    }

    init(
        configuration: NativeAuthenticationConfiguration,
        tokenStore: any SessionTokenStore,
        session: URLSession = Auth0NativeAuthenticationService.makeSession()
    ) {
        self.configuration = configuration
        self.tokenStore = tokenStore
        self.session = session
    }

    func requestPasswordReset(email: String) async throws {
        guard let connection = configuration.passwordResetConnection else {
            throw PasswordResetError.unavailable
        }
        guard let email = PasswordResetEmail.normalized(email) else {
            throw PasswordResetError.invalidEmail
        }
        try Task.checkCancellation()
        do {
            // Public Authentication API only. No Management API credential, new scope,
            // browser sign-in, session exchange, token storage or provider error display.
            try await Auth0
                .authentication(clientId: configuration.clientID, domain: configuration.domain, session: session)
                .resetPassword(email: email, connection: connection)
                .start()
            try Task.checkCancellation()
        } catch {
            if Task.isCancelled || error is CancellationError {
                throw CancellationError()
            }
            if let providerError = error as? AuthenticationError {
                if let cause = providerError.cause as? URLError, cause.code == .cancelled {
                    throw CancellationError()
                }
                if providerError.isNetworkError { throw PasswordResetError.network }
                if providerError.statusCode == 429 || providerError.isTooManyAttempts {
                    throw PasswordResetError.rateLimited
                }
            }
            if let networkError = error as? URLError {
                if networkError.code == .cancelled { throw CancellationError() }
                throw PasswordResetError.network
            }
            // Never expose provider messages, email existence or account metadata.
            throw PasswordResetError.requestFailed
        }
    }

    func signIn(
        intent: NativeAuthenticationIntent,
        loginHint: String?
    ) async throws {
        let credentials = try await Auth0
            .webAuth(clientId: configuration.clientID, domain: configuration.domain)
            .audience(configuration.audience)
            .scope("openid profile email session:create")
            .parameters(Self.authorizationParameters(for: intent, loginHint: loginHint))
            .start()
        if intent == .reauthenticate {
            try await refreshRilloraSession(accessToken: credentials.accessToken, idToken: credentials.idToken)
            return
        }
        let legalAcceptance = try HostedLegalAcceptanceProof.validate(
            accessToken: credentials.accessToken
        )
        try await establishRilloraSession(
            accessToken: credentials.accessToken,
            legalAcceptance: legalAcceptance,
            idToken: credentials.idToken
        )
    }

    func signInWithApple(
        authorizationCode: String,
        fullName: PersonNameComponents?,
        legalAcceptance: LegalAcceptanceProof
    ) async throws {
        guard canSignInWithApple else {
            throw NativeAuthenticationError.appleSignInNotConfigured
        }
        guard !authorizationCode.isEmpty else {
            throw NativeAuthenticationError.invalidAppleAuthorization
        }
        let credentials = try await Auth0
            .authentication(clientId: configuration.clientID, domain: configuration.domain)
            .login(
                appleAuthorizationCode: authorizationCode,
                fullName: fullName,
                audience: configuration.audience,
                scope: "openid profile email session:create"
            )
            .start()
        try await establishRilloraSession(
            accessToken: credentials.accessToken,
            legalAcceptance: legalAcceptance
        )
    }

    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async throws {
        guard canSignInWithGoogle,
              let googleIOSClientID = configuration.googleIOSClientID,
              let googleServerClientID = configuration.googleServerClientID else {
            throw NativeAuthenticationError.googleSignInNotConfigured
        }
        guard let presentingViewController = Self.presentingViewController() else {
            throw NativeAuthenticationError.invalidResponse
        }

        GIDSignIn.sharedInstance.configuration = GIDConfiguration(
            clientID: googleIOSClientID,
            serverClientID: googleServerClientID
        )
        let result: GIDSignInResult
        do {
            result = try await GIDSignIn.sharedInstance.signIn(
                withPresenting: presentingViewController
            )
        } catch let error as NSError
            where error.domain == kGIDSignInErrorDomain
                && error.code == GIDSignInError.canceled.rawValue {
            throw CancellationError()
        }
        guard let googleIDToken = result.user.idToken?.tokenString,
              !googleIDToken.isEmpty else {
            throw NativeAuthenticationError.invalidGoogleIdentity
        }
        let credentials = try await Auth0
            .authentication(clientId: configuration.clientID, domain: configuration.domain)
            .customTokenExchange(
                subjectToken: googleIDToken,
                subjectTokenType: Self.googleSubjectTokenType,
                audience: configuration.audience,
                scope: "openid profile email session:create"
            )
            .start()
        try await establishRilloraSession(
            accessToken: credentials.accessToken,
            legalAcceptance: legalAcceptance
        )
    }

    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async throws {
        guard canSignInWithPasskey else {
            throw NativeAuthenticationError.passkeySignInNotConfigured
        }
        let authentication = Auth0.authentication(
            clientId: configuration.clientID,
            domain: configuration.domain
        )
        let challenge = try await authentication
            .passkeyLoginChallenge(connection: "Username-Password-Authentication")
            .start()
        let provider = ASAuthorizationPlatformPublicKeyCredentialProvider(
            relyingPartyIdentifier: challenge.relyingPartyId
        )
        let request = provider.createCredentialAssertionRequest(
            challenge: challenge.challengeData
        )
        let credential: ASAuthorizationCredential
        do {
            credential = try await passkeyAuthorization.perform(request)
        } catch let error as ASAuthorizationError where error.code == .canceled {
            throw CancellationError()
        }
        guard let assertion = credential as? ASAuthorizationPlatformPublicKeyCredentialAssertion else {
            throw NativeAuthenticationError.invalidPasskeyIdentity
        }
        let credentials = try await authentication
            .login(
                passkey: assertion,
                challenge: challenge,
                connection: "Username-Password-Authentication",
                audience: configuration.audience,
                scope: "openid profile email session:create"
            )
            .start()
        try await establishRilloraSession(
            accessToken: credentials.accessToken,
            legalAcceptance: legalAcceptance
        )
    }

    private func establishRilloraSession(
        accessToken: String,
        legalAcceptance: LegalAcceptanceProof,
        idToken: String? = nil
    ) async throws {
        initialOverview = nil
        let response = try await exchange(
            accessToken: accessToken,
            legalAcceptance: legalAcceptance,
            idToken: idToken
        )
        guard response.tokenType.caseInsensitiveCompare("Bearer") == .orderedSame,
              response.sessionToken.range(
                of: #"^[A-Za-z0-9_-]{43,128}$"#,
                options: .regularExpression
              ) != nil else {
            throw NativeAuthenticationError.invalidSession
        }
        if let overview = response.overview {
            guard overview.session.plannerPublicId == response.plannerPublicId,
                  overview.session.authenticationMode == "bearer" else {
                throw NativeAuthenticationError.invalidSession
            }
        }
        try await tokenStore.save(response.sessionToken)
        initialOverview = response.overview
    }

    nonisolated static func authorizationParameters(
        for intent: NativeAuthenticationIntent,
        loginHint: String? = nil,
        localeIdentifier: String = Bundle.main.preferredLocalizations.first ?? "en"
    ) -> [String: String] {
        var parameters: [String: String] = switch intent {
        case .signIn:
            ["prompt": "login"]
        case .createAccount:
            ["prompt": "login", "screen_hint": "signup"]
        case .reauthenticate:
            ["prompt": "login", "max_age": "0"]
        case .google:
            ["prompt": "login", "connection": "google-oauth2"]
        }
        if parameters["max_age"] == nil { parameters["max_age"] = "86400" }
        parameters["rillora_auth_ui"] = "single-hosted-v1"
        parameters["ui_locales"] = localeIdentifier.hasPrefix("zh") ? "zh-CN" : "en"
        if let loginHint = loginHint?.trimmingCharacters(in: .whitespacesAndNewlines),
           !loginHint.isEmpty {
            parameters["login_hint"] = loginHint
        }
        return parameters
    }

    func signOut() async {
        initialOverview = nil
        try? await revokeSession(allDevices: false)
        try? await tokenStore.delete()
        try? await Auth0
            .webAuth(clientId: configuration.clientID, domain: configuration.domain)
            .logout()
    }

    func clearLocalSession() async {
        initialOverview = nil
        try? await tokenStore.delete()
    }

    func signOutAll() async throws {
        try await revokeSession(allDevices: true)
        try await tokenStore.delete()
        try? await Auth0
            .webAuth(clientId: configuration.clientID, domain: configuration.domain)
            .logout()
    }

    func revokeSession(allDevices: Bool) async throws {
        guard let token = try await tokenStore.read() else { throw NativeAuthenticationError.invalidSession }
        let url = configuration.plannerAPIBaseURL.appendingPathComponent(allDevices ? "auth/logout-all" : "auth/logout")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw NativeAuthenticationError.sessionRevocationRejected
        }
    }

    private func refreshRilloraSession(accessToken: String, idToken: String) async throws {
        guard let existing = try await tokenStore.read() else { throw NativeAuthenticationError.invalidSession }
        let url = configuration.sessionExchangeURL.deletingLastPathComponent().appendingPathComponent("reauthenticate")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(existing)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        request.httpBody = try JSONEncoder().encode(["accessToken": accessToken, "idToken": idToken])
        let (_, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            throw NativeAuthenticationError.exchangeRejected
        }
        // Keep the original opaque session and every in-progress screen/draft.
    }

    private func exchange(
        accessToken: String,
        legalAcceptance: LegalAcceptanceProof,
        idToken: String? = nil
    ) async throws -> NativeSessionExchangeResponse {
        var request = URLRequest(url: configuration.sessionExchangeURL)
        request.httpMethod = "POST"
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("no-store", forHTTPHeaderField: "Cache-Control")
        request.httpBody = try Self.sessionExchangeBody(
            legalAcceptance: legalAcceptance, idToken: idToken
        )
        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NativeAuthenticationError.invalidResponse
        }
        guard (200..<300).contains(httpResponse.statusCode) else {
            throw NativeAuthenticationError.exchangeRejected
        }
        do {
            return try JSONDecoder().decode(NativeSessionExchangeResponse.self, from: data)
        } catch {
            throw NativeAuthenticationError.invalidSession
        }
    }

    nonisolated private static func makeSession() -> URLSession {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 15
        configuration.timeoutIntervalForResource = 30
        configuration.requestCachePolicy = .reloadIgnoringLocalCacheData
        return URLSession(configuration: configuration)
    }

    private static func presentingViewController() -> UIViewController? {
        let root = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow)?
            .rootViewController
        return topViewController(from: root)
    }

    private static func topViewController(from viewController: UIViewController?) -> UIViewController? {
        if let presented = viewController?.presentedViewController {
            return topViewController(from: presented)
        }
        if let navigation = viewController as? UINavigationController {
            return topViewController(from: navigation.visibleViewController)
        }
        if let tab = viewController as? UITabBarController {
            return topViewController(from: tab.selectedViewController)
        }
        return viewController
    }

    nonisolated static func sessionExchangeBody(
        legalAcceptance: LegalAcceptanceProof,
        idToken: String? = nil
    ) throws -> Data {
        try JSONEncoder().encode(
            NativeSessionExchangeRequest(legalAcceptance: legalAcceptance, idToken: idToken)
        )
    }
}

@MainActor
final class UnavailableNativeAuthenticationService: NativeAuthenticating {
    private let accountsNotOpen: Bool
    init(accountsNotOpen: Bool = false) { self.accountsNotOpen = accountsNotOpen }
    let isConfigured = false
    let canSignInWithApple = false
    let canSignInWithGoogle = false
    let canSignInWithPasskey = false

    func signIn(
        intent: NativeAuthenticationIntent,
        loginHint: String?
    ) async throws {
        throw accountsNotOpen ? NativeAuthenticationError.accountsNotOpen : NativeAuthenticationError.notConfigured
    }

    func signInWithApple(
        authorizationCode: String,
        fullName: PersonNameComponents?,
        legalAcceptance: LegalAcceptanceProof
    ) async throws {
        throw NativeAuthenticationError.appleSignInNotConfigured
    }

    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async throws {
        throw NativeAuthenticationError.googleSignInNotConfigured
    }

    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async throws {
        throw NativeAuthenticationError.passkeySignInNotConfigured
    }

    func signOut() async {}

    func signOutAll() async throws {
        throw NativeAuthenticationError.notConfigured
    }
}

private struct NativeSessionExchangeResponse: Decodable {
    let tokenType: String
    let sessionToken: String
    let plannerPublicId: String?
    let overview: OverviewSnapshot?
}

private struct NativeSessionExchangeRequest: Encodable {
    let legalAcceptance: LegalAcceptanceProof
    let idToken: String?
}

enum NativeAuthenticationError: LocalizedError, Sendable {
    case accountsNotOpen
    case notConfigured
    case appleSignInNotConfigured
    case googleSignInNotConfigured
    case passkeySignInNotConfigured
    case invalidAppleAuthorization
    case invalidGoogleIdentity
    case invalidPasskeyIdentity
    case invalidResponse
    case exchangeRejected
    case invalidSession
    case sessionRevocationRejected

    var errorDescription: String? {
        switch self {
        case .accountsNotOpen:
            String(localized: "Accounts are not open yet. You can still explore Rillora and its guides.")
        case .notConfigured:
            String(localized: "Native sign in is not configured for this build.")
        case .appleSignInNotConfigured:
            String(localized: "Sign in with Apple is not configured for this build.")
        case .googleSignInNotConfigured:
            String(localized: "Sign in with Google is not configured for this build.")
        case .passkeySignInNotConfigured:
            String(localized: "Passkey sign in is not configured for this build.")
        case .invalidAppleAuthorization:
            String(localized: "Apple did not return a valid authorization code.")
        case .invalidGoogleIdentity:
            String(localized: "Google did not return a valid identity token.")
        case .invalidPasskeyIdentity:
            String(localized: "The passkey provider did not return a valid credential.")
        case .invalidResponse:
            String(localized: "The identity service returned an invalid response.")
        case .exchangeRejected:
            String(localized: "The identity service could not establish a Rillora session.")
        case .invalidSession:
            String(localized: "The identity service returned an invalid session.")
        case .sessionRevocationRejected:
            String(localized: "Rillora could not revoke every active app session.")
        }
    }
}

@MainActor
private final class PasskeyAuthorizationBroker: NSObject {
    private var continuation: CheckedContinuation<ASAuthorizationCredential, Error>?

    func perform(_ request: ASAuthorizationRequest) async throws -> ASAuthorizationCredential {
        guard continuation == nil else {
            throw NativeAuthenticationError.invalidResponse
        }
        return try await withCheckedThrowingContinuation { continuation in
            self.continuation = continuation
            let controller = ASAuthorizationController(authorizationRequests: [request])
            controller.delegate = self
            controller.presentationContextProvider = self
            controller.performRequests()
        }
    }
}

extension PasskeyAuthorizationBroker: ASAuthorizationControllerDelegate {
    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        continuation?.resume(returning: authorization.credential)
        continuation = nil
    }

    func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        continuation?.resume(throwing: error)
        continuation = nil
    }
}

extension PasskeyAuthorizationBroker: ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }
            .flatMap(\.windows)
            .first(where: \.isKeyWindow) ?? ASPresentationAnchor()
    }
}
