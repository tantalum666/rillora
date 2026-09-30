import Foundation

enum NativeAuthenticationCallback {
    static func isEnabledGoogleCallback(
        _ url: URL,
        configuration: NativeAuthenticationConfiguration?
    ) -> Bool {
        guard let configuration,
              configuration.googleNativeSignInEnabled,
              let clientID = configuration.googleIOSClientID,
              configuration.googleServerClientID != nil,
              clientID.hasSuffix(".apps.googleusercontent.com") else { return false }
        let expectedScheme = clientID.split(separator: ".").reversed().joined(separator: ".")
        return url.scheme == expectedScheme
    }
}
