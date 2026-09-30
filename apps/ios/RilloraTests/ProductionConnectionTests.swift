import XCTest
@testable import Rillora

final class ProductionConnectionTests: XCTestCase {
    private func configuration(base: String = "https://app.rillora.xyz/api/v1",
                               client: String = "POpNKTqlr6dHbJZLWPWxhyjg5qPtdrm4",
                               audience: String = "urn:rillora:production:api",
                               exchange: String = "https://app.rillora.xyz/api/auth/native/session",
                               developmentID: String? = nil) -> APIConfiguration {
        APIConfiguration(baseURL: URL(string: base)!, developmentPlannerID: developmentID,
            nativeAuthentication: NativeAuthenticationConfiguration(domain: "login.rillora.xyz", clientID: client,
                audience: audience, sessionExchangeURL: URL(string: exchange)!, appleNativeSignInEnabled: false,
                googleNativeSignInEnabled: false, googleIOSClientID: nil, googleServerClientID: nil,
                passkeyNativeSignInEnabled: false), customerAccessEnabled: false)
    }

    @MainActor
    func testBothNativeRevocationsUseTheProductionProxyAndRequireServerSuccess() async throws {
        let tokenStore = VolatileSessionTokenStore()
        try await tokenStore.save(String(repeating: "t", count: 43))
        let sessionConfig = URLSessionConfiguration.ephemeral
        sessionConfig.protocolClasses = [LogoutURLProtocol.self]
        let session = URLSession(configuration: sessionConfig)
        defer { session.invalidateAndCancel() }
        LogoutURLProtocol.probe.reset()
        let service = Auth0NativeAuthenticationService(configuration: try XCTUnwrap(configuration().nativeAuthentication),
            tokenStore: tokenStore, session: session)
        try await service.revokeSession(allDevices: false)
        try await service.revokeSession(allDevices: true)
        XCTAssertEqual(LogoutURLProtocol.probe.paths(), ["/api/v1/auth/logout", "/api/v1/auth/logout-all"])
        XCTAssertEqual(configuration().nativeAuthentication?.plannerAPIBaseURL.absoluteString, "https://app.rillora.xyz/api/v1")
        XCTAssertEqual(configuration(exchange: "https://api.example.test/auth/native/session").nativeAuthentication?.plannerAPIBaseURL.path, "/v1")
    }

    func testPreparedProductionConnectionIsValidButDoesNotOpenAccounts() throws {
        let value = configuration()
        try value.validateProduction()
        XCTAssertFalse(value.customerAccessEnabled)
    }

    func testProductionRejectsTestIdentityUnsafeOriginsAndDevelopmentIdentity() {
        for value in [configuration(base: "https://app.staging.rillora.xyz/api/v1"),
                      configuration(base: "http://app.rillora.xyz/api/v1"),
                      configuration(base: "https://app.rillora.xyz/api/v1?redirect=elsewhere"),
                      configuration(client: "HDfmJrHaM08lDAgsygPm7b5OB1aaUhrZ"),
                      configuration(audience: "urn:rillora:api"),
                      configuration(exchange: "https://app.staging.rillora.xyz/api/auth/native/session"),
                      configuration(developmentID: "fixture")]
        { XCTAssertThrowsError(try value.validateProduction()) }
    }

    func testSessionAndDeletionProofNamespacesCannotCrossOrigins() {
        let staging = URL(string: "https://l1g8350qw0.execute-api.eu-central-1.amazonaws.com/v1")!
        let production = URL(string: "https://app.rillora.xyz/api/v1")!
        for purpose in [SessionStorageNamespace.Purpose.session, .deletionReference] {
            let old = SessionStorageNamespace.service(for: staging, purpose: purpose)
            let new = SessionStorageNamespace.service(for: production, purpose: purpose)
            XCTAssertEqual(old, "com.rillora.ios.\(purpose.rawValue)")
            XCTAssertNotEqual(new, old)
            XCTAssertEqual(new, SessionStorageNamespace.service(for: production.appendingPathComponent(""), purpose: purpose))
            XCTAssertNotEqual(new, SessionStorageNamespace.service(for: nil, purpose: purpose))
        }
        XCTAssertNotEqual(SessionStorageNamespace.service(for: production, purpose: .session),
                          SessionStorageNamespace.service(for: production, purpose: .deletionReference))
    }

    @MainActor
    func testClosedServiceDoesNotOpenHostedAuthentication() async {
        let service = UnavailableNativeAuthenticationService(accountsNotOpen: true)
        XCTAssertFalse(service.isConfigured)
        do {
            try await service.signIn(intent: .signIn, loginHint: nil)
            XCTFail("Closed candidate must not start authentication")
        } catch {
            XCTAssertEqual(error.localizedDescription, "Accounts are not open yet. You can still explore Rillora and its guides.")
        }
    }
}

private final class LogoutProbe: @unchecked Sendable {
    private let lock = NSLock()
    private var values: [String] = []
    func reset() { lock.withLock { values = [] } }
    func record(_ path: String) { lock.withLock { values.append(path) } }
    func paths() -> [String] { lock.withLock { values } }
}
private final class LogoutURLProtocol: URLProtocol, @unchecked Sendable {
    static let probe = LogoutProbe()
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        let path = request.url!.path
        Self.probe.record(path)
        let valid = request.url?.host == "app.rillora.xyz" && request.httpMethod == "POST"
            && request.value(forHTTPHeaderField: "Authorization") == "Bearer " + String(repeating: "t", count: 43)
            && ["/api/v1/auth/logout", "/api/v1/auth/logout-all"].contains(path)
        let response = HTTPURLResponse(url: request.url!, statusCode: valid ? 204 : 404, httpVersion: "HTTP/1.1", headerFields: nil)!
        client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
        client?.urlProtocolDidFinishLoading(self)
    }
    override func stopLoading() {}
}
