import Foundation
import Observation
import Auth0
import AuthenticationServices

@MainActor
@Observable
final class AuthenticationStore {
    private(set) var isWorking = false
    var errorMessage: String?

    private let service: any NativeAuthenticating
    private let overviewStore: OverviewStore
    private let commerceStore: CommerceStore?

    init(
        service: any NativeAuthenticating,
        overviewStore: OverviewStore,
        commerceStore: CommerceStore? = nil
    ) {
        self.service = service
        self.overviewStore = overviewStore
        self.commerceStore = commerceStore
    }

    var canSignIn: Bool { service.isConfigured }
    var canSignInWithApple: Bool { service.canSignInWithApple }
    var canSignInWithGoogle: Bool { service.canSignInWithGoogle }
    var canSignInWithPasskey: Bool { service.canSignInWithPasskey }

    @discardableResult
    func signIn(
        loginHint: String? = nil,
        legalAcceptance: LegalAcceptanceProof
    ) async -> Bool {
        await authenticate(
            intent: .signIn,
            loginHint: loginHint,
            legalAcceptance: legalAcceptance
        )
    }

    @discardableResult
    func createAccount(
        loginHint: String? = nil,
        legalAcceptance: LegalAcceptanceProof
    ) async -> Bool {
        await authenticate(
            intent: .createAccount,
            loginHint: loginHint,
            legalAcceptance: legalAcceptance
        )
    }

    @discardableResult
    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async -> Bool {
        await authenticateNativeMethod {
            try await self.service.signInWithGoogle(legalAcceptance: legalAcceptance)
        }
    }

    @discardableResult
    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async -> Bool {
        await authenticateNativeMethod {
            try await self.service.signInWithPasskey(legalAcceptance: legalAcceptance)
        }
    }

    private func authenticateNativeMethod(
        _ operation: @escaping @MainActor () async throws -> Void
    ) async -> Bool {
        guard !isWorking else { return false }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await operation()
            return await finishAuthentication()
        } catch is CancellationError {
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    @discardableResult
    func signInWithApple(
        result: Result<ASAuthorization, Error>,
        legalAcceptance: LegalAcceptanceProof
    ) async -> Bool {
        guard !isWorking else { return false }
        switch result {
        case .failure(let error):
            if let authorizationError = error as? ASAuthorizationError,
               authorizationError.code == .canceled {
                return false
            }
            errorMessage = error.localizedDescription
            return false
        case .success(let authorization):
            guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential,
                  let authorizationCode = credential.authorizationCode,
                  let code = String(data: authorizationCode, encoding: .utf8),
                  !code.isEmpty else {
                errorMessage = NativeAuthenticationError.invalidAppleAuthorization.localizedDescription
                return false
            }
            return await authenticateWithApple(
                authorizationCode: code,
                fullName: credential.fullName,
                legalAcceptance: legalAcceptance
            )
        }
    }

    private func authenticate(
        intent: NativeAuthenticationIntent,
        loginHint: String?,
        legalAcceptance: LegalAcceptanceProof
    ) async -> Bool {
        guard !isWorking else { return false }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await service.signIn(
                intent: intent,
                loginHint: loginHint,
                legalAcceptance: legalAcceptance
            )
            return await finishAuthentication()
        } catch is CancellationError {
            return false
        } catch let error as WebAuthError where error == .userCancelled {
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func authenticateWithApple(
        authorizationCode: String,
        fullName: PersonNameComponents?,
        legalAcceptance: LegalAcceptanceProof
    ) async -> Bool {
        guard !isWorking else { return false }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await service.signInWithApple(
                authorizationCode: authorizationCode,
                fullName: fullName,
                legalAcceptance: legalAcceptance
            )
            return await finishAuthentication()
        } catch is CancellationError {
            return false
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    private func finishAuthentication() async -> Bool {
        commerceStore?.reset()
        overviewStore.reset()
        await overviewStore.reload()
        if case .loaded = overviewStore.state { return true }
        errorMessage = "Rillora could not load your private plan after sign in."
        return false
    }

    func signOut() async {
        guard !isWorking else { return }
        isWorking = true
        errorMessage = nil
        await service.signOut()
        commerceStore?.reset()
        overviewStore.reset()
        await overviewStore.reload()
        isWorking = false
    }

    func signOutAll() async {
        guard !isWorking else { return }
        isWorking = true
        errorMessage = nil
        defer { isWorking = false }
        do {
            try await service.signOutAll()
            commerceStore?.reset()
            overviewStore.reset()
            await overviewStore.reload()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
