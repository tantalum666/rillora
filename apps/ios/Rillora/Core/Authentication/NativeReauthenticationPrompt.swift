import Foundation
import UIKit

extension Notification.Name {
    static let rilloraReauthenticationRequired = Notification.Name("rillora.reauthenticationRequired")
}

@MainActor
enum NativeReauthenticationPrompt {
    private static var presenting = false

    static func present(using store: AuthenticationStore) async {
        guard !presenting, !store.isWorking else { return }
        presenting = true
        defer { presenting = false }
        // The request's ordinary error may already have an alert. Let the user
        // dismiss it; never dismiss their editor, sheet or another alert for them.
        for _ in 0..<60 {
            try? await Task.sleep(for: .milliseconds(500))
            guard !Task.isCancelled else { return }
            guard let controller = topController() else { return }
            if controller is UIAlertController || controller.isBeingPresented || controller.isBeingDismissed { continue }
            let proceed = await withCheckedContinuation { continuation in
                let alert = UIAlertController(title: String(localized: "Sign in again"), message: String(localized: "Confirm it is still you before continuing. Your changes stay here and nothing is submitted automatically."), preferredStyle: .alert)
                alert.addAction(UIAlertAction(title: String(localized: "Keep editing"), style: .cancel) { _ in continuation.resume(returning: false) })
                alert.addAction(UIAlertAction(title: String(localized: "Sign in again"), style: .default) { _ in continuation.resume(returning: true) })
                controller.present(alert, animated: true)
            }
            guard proceed else { return }
            let completed = await store.reauthenticate()
            let failure = store.errorMessage
            store.errorMessage = nil
            guard completed || failure != nil else { return } // cancellation retains the old session
            try? await Task.sleep(for: .milliseconds(350))
            guard let presenter = topController(), !(presenter is UIAlertController) else { return }
            let alert = UIAlertController(title: completed ? String(localized: "Sign-in complete") : String(localized: "Sign in could not be verified"),
                message: completed ? String(localized: "Your changes are still here. Try the action again when you are ready.") : String(localized: "Use the same account and try again. Your changes have not been submitted."), preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: String(localized: "Return to editing"), style: .cancel))
            presenter.present(alert, animated: true)
            return
        }
    }

    private static func topController() -> UIViewController? {
        var current = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            .filter { $0.activationState == .foregroundActive }.flatMap(\.windows).first(where: \.isKeyWindow)?.rootViewController
        while let presented = current?.presentedViewController { current = presented }
        return current
    }
}
