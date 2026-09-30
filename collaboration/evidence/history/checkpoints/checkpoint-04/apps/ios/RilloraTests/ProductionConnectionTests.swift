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
