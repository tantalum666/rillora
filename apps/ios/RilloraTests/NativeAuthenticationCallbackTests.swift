import XCTest
@testable import Rillora

final class NativeAuthenticationCallbackTests: XCTestCase {
    private func configuration(enabled: Bool) -> NativeAuthenticationConfiguration {
        NativeAuthenticationConfiguration(
            domain: "identity.example", clientID: "fixture", audience: "urn:fixture",
            sessionExchangeURL: URL(string: "https://identity.example/session")!,
            appleNativeSignInEnabled: false, googleNativeSignInEnabled: enabled,
            googleIOSClientID: "synthetic.apps.googleusercontent.com",
            googleServerClientID: "synthetic-server", passkeyNativeSignInEnabled: false
        )
    }
    func testDisabledGoogleDoesNotReceiveAnyCallback() {
        let url = URL(string: "com.googleusercontent.apps.synthetic:/oauthredirect?code=synthetic")!
        XCTAssertFalse(NativeAuthenticationCallback.isEnabledGoogleCallback(url, configuration: configuration(enabled: false)))
        XCTAssertFalse(NativeAuthenticationCallback.isEnabledGoogleCallback(url, configuration: nil))
    }
    func testHostedLoginSharingAndForeignSchemesNeverReachGoogle() {
        for value in ["com.rillora.ios://login.rillora.xyz/ios/com.rillora.ios/callback", "rillora://invite", "https://example.test/", "com.googleusercontent.apps.other:/oauthredirect"] {
            XCTAssertFalse(NativeAuthenticationCallback.isEnabledGoogleCallback(URL(string: value)!, configuration: configuration(enabled: true)))
        }
        XCTAssertTrue(NativeAuthenticationCallback.isEnabledGoogleCallback(
            URL(string: "com.googleusercontent.apps.synthetic:/oauthredirect")!, configuration: configuration(enabled: true)
        ))
    }
}
