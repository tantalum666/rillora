import Auth0
import Foundation
import XCTest
@testable import Rillora

@MainActor
final class PasswordResetTests: XCTestCase {
    func testConfigurationDefaultsToUnavailableAndAcceptsOnlyReviewedConnection() {
        XCTAssertNil(configuration().passwordResetConnection)
        for value in ["", "$(RILLORA_PASSWORD_RESET_CONNECTION)", "google-oauth2", "apple", "another-database"] {
            XCTAssertNil(configuration(connection: value).passwordResetConnection, value)
        }
        XCTAssertEqual(configuration(connection: " Username-Password-Authentication\n").passwordResetConnection,
                       "Username-Password-Authentication")
    }

    func testBuildConfigurationParsesResetIndependentlyOfSignIn() throws {
        var environment = [
            "RILLORA_AUTH0_DOMAIN": "reset.example.test",
            "RILLORA_AUTH0_CLIENT_ID": "fixture",
            "RILLORA_AUTH0_AUDIENCE": "urn:fixture",
            "RILLORA_NATIVE_SESSION_URL": "https://reset.example.test/auth/native/session",
            "RILLORA_APPLE_SIGN_IN_ENABLED": "false",
            "RILLORA_GOOGLE_NATIVE_SIGN_IN_ENABLED": "false",
            "RILLORA_PASSKEY_NATIVE_SIGN_IN_ENABLED": "false",
        ]
        for value in ["", "$(RILLORA_PASSWORD_RESET_CONNECTION)", "unreviewed", "Username-Password-Authentication"] {
            environment["RILLORA_PASSWORD_RESET_CONNECTION"] = value
            let parsed = try XCTUnwrap(NativeAuthenticationConfiguration.current(bundle: .main, environment: environment))
            XCTAssertEqual(parsed.domain, "reset.example.test")
            XCTAssertEqual(parsed.clientID, "fixture")
            XCTAssertEqual(parsed.audience, "urn:fixture")
            XCTAssertEqual(parsed.passwordResetConnection,
                           value == "Username-Password-Authentication" ? value : nil)
        }
    }

    func testEmailValidationIsLocalAndPreservesTheExplicitAddress() {
        for email in ["", " ", "user", "@example.test", "user@", "user@example", "a@@example.test",
                      "a b@example.test", "a\nb@example.test", ".user@example.test", "a..b@example.test",
                      "user@-example.test", "user@example-.test", "user@example..test",
                      String(repeating: "a", count: 65) + "@example.test"] {
            XCTAssertNil(PasswordResetEmail.normalized(email), email)
        }
        XCTAssertEqual(PasswordResetEmail.normalized("  Example+reset@Example.test\n"), "Example+reset@Example.test")
        XCTAssertNotNil(PasswordResetEmail.normalized("first.last+tag@example.test"))
    }

    func testOpeningAndEditingTheFormNeverSendsARequest() {
        let service = ResetStub()
        let store = PasswordResetStore(service: service)
        XCTAssertEqual(store.email, "")
        XCTAssertFalse(store.canSubmit)
        XCTAssertTrue(service.emails.isEmpty)
        store.email = "explicit@example.test"
        XCTAssertTrue(store.canSubmit)
        XCTAssertTrue(service.emails.isEmpty)
    }

    func testInvalidAndUnavailableRequestsFailBeforeTransport() async {
        let service = ResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "invalid"
        let invalid = await store.submit()
        XCTAssertFalse(invalid)
        XCTAssertEqual(store.errorMessage, PasswordResetError.invalidEmail.localizedDescription)
        service.canResetPassword = false
        store.email = "explicit@example.test"
        let unavailable = await store.submit()
        XCTAssertFalse(unavailable)
        XCTAssertEqual(store.errorMessage, PasswordResetError.unavailable.localizedDescription)
        XCTAssertTrue(service.emails.isEmpty)
    }

    func testSuccessClearsEmailAndDoesNotResend() async {
        let service = ResetStub()
        let store = PasswordResetStore(service: service)
        store.email = " explicit+reset@example.test "
        let result = await store.submit()
        XCTAssertTrue(result)
        XCTAssertEqual(service.emails, ["explicit+reset@example.test"])
        XCTAssertTrue(store.isSubmitted)
        XCTAssertFalse(store.isSending)
        XCTAssertFalse(store.canSubmit)
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(store.email, "")
        let repeated = await store.submit()
        XCTAssertFalse(repeated)
        XCTAssertEqual(service.emails.count, 1)
    }

    func testDuplicateSubmissionsAreIgnoredWhileRequestIsPending() async {
        let service = SuspendedResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "explicit@example.test"
        let first = Task { await store.submit() }
        await service.waitForRequest()
        XCTAssertTrue(store.isSending)
        XCTAssertFalse(store.canSubmit)
        let duplicate = await store.submit()
        XCTAssertFalse(duplicate)
        XCTAssertEqual(service.emails.count, 1)
        service.finish()
        let result = await first.value
        XCTAssertTrue(result)
        XCTAssertFalse(store.isSending)
    }

    func testClearIgnoresLateCompletionAndDiscardsPrivateFormData() async {
        let service = SuspendedResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "explicit@example.test"
        let request = Task { await store.submit() }
        await service.waitForRequest()
        store.clear()
        service.finish()
        let result = await request.value
        XCTAssertFalse(result)
        XCTAssertFalse(store.isSubmitted)
        XCTAssertFalse(store.isSending)
        XCTAssertNil(store.errorMessage)
        XCTAssertEqual(store.email, "")
    }

    func testOldCompletionCannotClearANewerRequest() async {
        let service = QueuedResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "first@example.test"
        let first = Task { await store.submit() }
        await service.waitForRequest(count: 1)
        store.clear()
        store.email = "second@example.test"
        let second = Task { await store.submit() }
        await service.waitForRequest(count: 2)
        service.finish(index: 0)
        let oldResult = await first.value
        XCTAssertFalse(oldResult)
        XCTAssertTrue(store.isSending)
        XCTAssertFalse(store.isSubmitted)
        XCTAssertEqual(store.email, "second@example.test")
        service.finish(index: 1)
        let newResult = await second.value
        XCTAssertTrue(newResult)
        XCTAssertFalse(store.isSending)
        XCTAssertEqual(service.emails, ["first@example.test", "second@example.test"])
    }

    func testTaskCancellationCannotPublishSuccessOrFailure() async {
        let service = SuspendedResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "explicit@example.test"
        let request = Task { await store.submit() }
        await service.waitForRequest()
        request.cancel()
        service.finish()
        let result = await request.value
        XCTAssertFalse(result)
        XCTAssertFalse(store.isSending)
        XCTAssertFalse(store.isSubmitted)
        XCTAssertNil(store.errorMessage)
    }

    func testCancellationAndNetworkErrorsAreSafeAndRetryable() async {
        let service = ResetStub()
        let store = PasswordResetStore(service: service)
        store.email = "explicit@example.test"
        for error in [CancellationError() as any Error, URLError(.cancelled)] {
            service.error = error
            _ = await store.submit()
            XCTAssertNil(store.errorMessage)
            XCTAssertFalse(store.isSubmitted)
            XCTAssertFalse(store.isSending)
            XCTAssertTrue(store.canSubmit)
        }
        service.error = URLError(.notConnectedToInternet)
        _ = await store.submit()
        XCTAssertEqual(store.errorMessage, PasswordResetError.network.localizedDescription)
        XCTAssertEqual(store.email, "explicit@example.test")
        service.error = nil
        let retry = await store.submit()
        XCTAssertTrue(retry)
        XCTAssertNil(store.errorMessage)
    }

    func testUnknownProviderErrorsNeverExposeEmailOrAccountExistence() async {
        let service = ResetStub()
        let store = PasswordResetStore(service: service)
        let messages = ["Unknown account explicit@example.test", "Account exists explicit@example.test", "Internal provider detail"]
        for message in messages {
            store.email = "explicit@example.test"
            service.error = NSError(domain: "fixture", code: 400, userInfo: [NSLocalizedDescriptionKey: message])
            _ = await store.submit()
            XCTAssertEqual(store.errorMessage, PasswordResetError.requestFailed.localizedDescription)
            XCTAssertFalse(store.errorMessage?.contains("explicit@example.test") == true)
        }
    }

    func testRateLimitUsesSafeMessageWithoutAutomaticRetry() async {
        let service = ResetStub()
        service.error = PasswordResetError.rateLimited
        let store = PasswordResetStore(service: service)
        store.email = "explicit@example.test"
        _ = await store.submit()
        XCTAssertEqual(store.errorMessage, PasswordResetError.rateLimited.localizedDescription)
        XCTAssertEqual(service.emails.count, 1)
        XCTAssertFalse(store.isSending)
        XCTAssertFalse(store.isSubmitted)
    }

    func testDefaultAndClosedAuthenticationCannotResetPasswords() async {
        let service = UnavailableNativeAuthenticationService(accountsNotOpen: true)
        XCTAssertFalse(service.canResetPassword)
        do {
            try await service.requestPasswordReset(email: "explicit@example.test")
            XCTFail("Unavailable service must not start reset")
        } catch {
            XCTAssertEqual(error as? PasswordResetError, .unavailable)
        }
    }

    func testResetDoesNotChangeGlobalAuthenticationOrOverviewState() async throws {
        let overviewService = NeverLoadedOverviewService()
        let overview = OverviewStore(service: overviewService)
        let native = ResetNativeStub()
        let auth = AuthenticationStore(service: native, overviewStore: overview)
        auth.errorMessage = "Existing sign-in notice"
        let before = overview.state
        XCTAssertTrue(auth.canResetPassword)
        try await auth.requestPasswordReset(email: "explicit@example.test")
        XCTAssertEqual(native.resetEmails, ["explicit@example.test"])
        XCTAssertEqual(auth.errorMessage, "Existing sign-in notice")
        XCTAssertFalse(auth.isWorking)
        XCTAssertEqual(overview.state, before)
        XCTAssertEqual(native.otherCalls, 0)
        native.resetError = PasswordResetError.rateLimited
        do {
            try await auth.requestPasswordReset(email: "explicit@example.test")
            XCTFail("Reset failure must be forwarded to its dedicated form")
        } catch { XCTAssertEqual(error as? PasswordResetError, .rateLimited) }
        XCTAssertEqual(auth.errorMessage, "Existing sign-in notice")
        XCTAssertFalse(auth.isWorking)
        XCTAssertEqual(overview.state, before)
        XCTAssertEqual(native.otherCalls, 0)
        let fetches = await overviewService.fetchCount
        XCTAssertEqual(fetches, 0)
    }

    func testSDKRequestUsesOnlyReviewedPublicResetPayloadAndLeavesTokenUntouched() async throws {
        let host = "reset-success.example.test"
        ResetURLProtocol.probe.configure(host: host, result: .success)
        let session = mockSession()
        defer { session.invalidateAndCancel() }
        let tokens = ResetTokenSpy()
        let service = Auth0NativeAuthenticationService(
            configuration: configuration(connection: "Username-Password-Authentication", host: host),
            tokenStore: tokens, session: session)
        try await service.requestPasswordReset(email: " explicit@example.test ")
        let requests = ResetURLProtocol.probe.requests(for: host)
        XCTAssertEqual(requests.count, 1)
        let request = try XCTUnwrap(requests.first)
        XCTAssertEqual(request.url, "https://\(host)/dbconnections/change_password")
        XCTAssertEqual(request.method, "POST")
        XCTAssertNil(request.authorization)
        XCTAssertEqual(request.body, ["email": "explicit@example.test", "connection": "Username-Password-Authentication", "client_id": "fixture"])
        let tokenAccesses = await tokens.accessCount
        XCTAssertEqual(tokenAccesses, 0)
        XCTAssertNil(service.takeInitialOverview())
    }

    func testServiceRejectsMissingConfigurationAndBadEmailBeforeSDKCall() async {
        let host = "reset-no-send.example.test"
        ResetURLProtocol.probe.configure(host: host, result: .success)
        let session = mockSession()
        defer { session.invalidateAndCancel() }
        let cases: [(String?, String, PasswordResetError)] = [
            (nil, "explicit@example.test", .unavailable),
            ("Username-Password-Authentication", "invalid", .invalidEmail),
        ]
        for (connection, email, expected) in cases {
            let service = Auth0NativeAuthenticationService(configuration: configuration(connection: connection, host: host),
                tokenStore: ResetTokenSpy(), session: session)
            do {
                try await service.requestPasswordReset(email: email)
                XCTFail("Invalid request must not reach SDK transport")
            } catch { XCTAssertEqual(error as? PasswordResetError, expected) }
        }
        XCTAssertTrue(ResetURLProtocol.probe.requests(for: host).isEmpty)
    }

    func testSDKRateLimitNetworkAndFailureAreMappedWithoutProviderText() async {
        let cases: [(ResetTransportResult, PasswordResetError)] = [
            (.rateLimited, .rateLimited), (.tooManyAttempts, .rateLimited),
            (.network, .network), (.providerFailure, .requestFailed), (.serverFailure, .requestFailed),
        ]
        for (index, item) in cases.enumerated() {
            let host = "reset-error-\(index).example.test"
            ResetURLProtocol.probe.configure(host: host, result: item.0)
            let session = mockSession()
            defer { session.invalidateAndCancel() }
            let tokens = ResetTokenSpy()
            let service = Auth0NativeAuthenticationService(
                configuration: configuration(connection: "Username-Password-Authentication", host: host),
                tokenStore: tokens, session: session)
            do {
                try await service.requestPasswordReset(email: "explicit@example.test")
                XCTFail("Fixture error must remain a safe failure")
            } catch { XCTAssertEqual(error as? PasswordResetError, item.1) }
            let tokenAccesses = await tokens.accessCount
            XCTAssertEqual(tokenAccesses, 0)
        }
    }

    func testSDKNetworkCancellationIsNotDisplayedAsFailure() async {
        let host = "reset-cancel.example.test"
        ResetURLProtocol.probe.configure(host: host, result: .cancelled)
        let session = mockSession()
        defer { session.invalidateAndCancel() }
        let service = Auth0NativeAuthenticationService(
            configuration: configuration(connection: "Username-Password-Authentication", host: host),
            tokenStore: ResetTokenSpy(), session: session)
        do {
            try await service.requestPasswordReset(email: "explicit@example.test")
            XCTFail("Cancellation must not be reported as success")
        } catch { XCTAssertTrue(error is CancellationError) }
    }

    func testBilingualConfirmationIsConditionalAndNeverClaimsDelivery() throws {
        let key = "If this email has an eligible password account, you’ll receive a reset link. Check your spam folder too."
        for (language, expected) in [
            ("en", key),
            ("zh-Hans", "如果此邮箱对应的账号支持密码重置，你会收到重置链接。也请检查垃圾邮件文件夹。"),
        ] {
            let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
            let bundle = try XCTUnwrap(Bundle(path: path))
            XCTAssertEqual(bundle.localizedString(forKey: key, value: nil, table: "Localizable"), expected)
        }
    }

    private func mockSession() -> URLSession {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [ResetURLProtocol.self]
        return URLSession(configuration: config)
    }

    private func configuration(connection: String? = nil, host: String = "reset.example.test") -> NativeAuthenticationConfiguration {
        NativeAuthenticationConfiguration(domain: host, clientID: "fixture", audience: "urn:fixture",
            sessionExchangeURL: URL(string: "https://\(host)/auth/native/session")!,
            appleNativeSignInEnabled: false, googleNativeSignInEnabled: false,
            googleIOSClientID: nil, googleServerClientID: nil, passkeyNativeSignInEnabled: false,
            passwordResetConnection: connection)
    }
}

@MainActor
private final class ResetStub: PasswordResetRequesting {
    var canResetPassword = true
    var emails: [String] = []
    var error: (any Error)?
    func requestPasswordReset(email: String) async throws {
        emails.append(email)
        if let error { throw error }
    }
}

@MainActor
private final class SuspendedResetStub: PasswordResetRequesting {
    let canResetPassword = true
    private(set) var emails: [String] = []
    private var pending: CheckedContinuation<Void, Never>?
    private var observer: CheckedContinuation<Void, Never>?
    func requestPasswordReset(email: String) async throws {
        emails.append(email)
        await withCheckedContinuation { continuation in
            pending = continuation
            observer?.resume()
            observer = nil
        }
    }
    func waitForRequest() async {
        if pending != nil { return }
        await withCheckedContinuation { observer = $0 }
    }
    func finish() { pending?.resume(); pending = nil }
}

@MainActor
private final class QueuedResetStub: PasswordResetRequesting {
    let canResetPassword = true
    private(set) var emails: [String] = []
    private var pending: [Int: CheckedContinuation<Void, Never>] = [:]
    private var expectedCount = 0
    private var observer: CheckedContinuation<Void, Never>?
    func requestPasswordReset(email: String) async throws {
        let index = emails.count
        emails.append(email)
        await withCheckedContinuation { continuation in
            pending[index] = continuation
            if emails.count >= expectedCount { observer?.resume(); observer = nil }
        }
    }
    func waitForRequest(count: Int) async {
        if emails.count >= count { return }
        expectedCount = count
        await withCheckedContinuation { observer = $0 }
    }
    func finish(index: Int) { pending.removeValue(forKey: index)?.resume() }
}

@MainActor
private final class ResetNativeStub: NativeAuthenticating {
    let isConfigured = true
    let canSignInWithApple = false
    let canSignInWithGoogle = false
    let canSignInWithPasskey = false
    let canResetPassword = true
    var resetEmails: [String] = []
    var resetError: PasswordResetError?
    var otherCalls = 0
    func requestPasswordReset(email: String) async throws {
        resetEmails.append(email)
        if let resetError { throw resetError }
    }
    func signIn(intent: NativeAuthenticationIntent, loginHint: String?) async throws { otherCalls += 1 }
    func signInWithApple(authorizationCode: String, fullName: PersonNameComponents?, legalAcceptance: LegalAcceptanceProof) async throws { otherCalls += 1 }
    func signInWithGoogle(legalAcceptance: LegalAcceptanceProof) async throws { otherCalls += 1 }
    func signInWithPasskey(legalAcceptance: LegalAcceptanceProof) async throws { otherCalls += 1 }
    func takeInitialOverview() -> OverviewSnapshot? { otherCalls += 1; return nil }
    func signOut() async { otherCalls += 1 }
    func signOutAll() async throws { otherCalls += 1 }
}

private actor NeverLoadedOverviewService: OverviewServing {
    private(set) var fetchCount = 0
    func fetchOverview() async throws -> OverviewSnapshot {
        fetchCount += 1
        throw RilloraAPIError.invalidResponse
    }
}

private actor ResetTokenSpy: SessionTokenStore {
    private(set) var accessCount = 0
    func read() async throws -> String? { accessCount += 1; return "untouched-fixture-token" }
    func save(_ token: String) async throws { accessCount += 1 }
    func delete() async throws { accessCount += 1 }
}

private enum ResetTransportResult: Sendable {
    case success, rateLimited, tooManyAttempts, network, providerFailure, serverFailure, cancelled
}

private struct ResetRequestSnapshot: Sendable {
    let url: String
    let method: String?
    let authorization: String?
    let body: [String: String]
}

private final class ResetTransportProbe: @unchecked Sendable {
    private let lock = NSLock()
    private var results: [String: ResetTransportResult] = [:]
    private var records: [String: [ResetRequestSnapshot]] = [:]
    func configure(host: String, result: ResetTransportResult) {
        lock.withLock { results[host] = result; records[host] = [] }
    }
    func record(_ request: URLRequest) -> ResetTransportResult {
        var data = request.httpBody ?? Data()
        if data.isEmpty, let stream = request.httpBodyStream {
            stream.open()
            defer { stream.close() }
            var buffer = [UInt8](repeating: 0, count: 1024)
            while stream.hasBytesAvailable {
                let count = stream.read(&buffer, maxLength: buffer.count)
                guard count > 0 else { break }
                data.append(contentsOf: buffer.prefix(count))
            }
        }
        let body = (try? JSONSerialization.jsonObject(with: data)) as? [String: String] ?? [:]
        let snapshot = ResetRequestSnapshot(url: request.url!.absoluteString, method: request.httpMethod,
                                           authorization: request.value(forHTTPHeaderField: "Authorization"), body: body)
        return lock.withLock {
            let host = request.url!.host!
            records[host, default: []].append(snapshot)
            return results[host] ?? .providerFailure
        }
    }
    func requests(for host: String) -> [ResetRequestSnapshot] { lock.withLock { records[host] ?? [] } }
}

private final class ResetURLProtocol: URLProtocol, @unchecked Sendable {
    static let probe = ResetTransportProbe()
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let result = Self.probe.record(request)
        let status: Int
        let body: String
        switch result {
        case .network:
            client?.urlProtocol(self, didFailWithError: URLError(.notConnectedToInternet))
            return
        case .cancelled:
            client?.urlProtocol(self, didFailWithError: URLError(.cancelled))
            return
        case .success:
            status = 200; body = "Provider accepted request"
        case .rateLimited:
            status = 429; body = #"{"error":"rate_limit_exceeded","description":"PRIVATE PROVIDER DETAIL"}"#
        case .tooManyAttempts:
            status = 400; body = #"{"error":"too_many_attempts","description":"PRIVATE PROVIDER DETAIL"}"#
        case .providerFailure:
            status = 400; body = #"{"error":"invalid_request","description":"PRIVATE PROVIDER DETAIL"}"#
        case .serverFailure:
            status = 503; body = #"{"error":"server_error","description":"PRIVATE PROVIDER DETAIL"}"#
        }
        let response = HTTPURLResponse(url: request.url!, statusCode: status, httpVersion: "HTTP/1.1",
                                       headerFields: ["Content-Type": "application/json"])!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocol(self, didLoad: Data(body.utf8))
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
