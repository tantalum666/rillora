import SwiftUI
import WatchKit
import RilloraCheckInKit

@MainActor
final class RilloraWatchDelegate: NSObject, WKApplicationDelegate {
    let store = CheckInWatchStore.local()
    private var link: CheckInWatchLink?
    func applicationDidFinishLaunching() {
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["RILLORA_WATCH_UI_FIXTURE"] != nil { return }
        #endif
        link = CheckInWatchLink(store: store)
    }
}

@main
struct RilloraWatchApp: App {
    @WKApplicationDelegateAdaptor(RilloraWatchDelegate.self) private var delegate
    @State private var navigationID = UUID()
    var body: some Scene {
        WindowGroup {
            NavigationStack { CheckInWatchView(store: delegate.store) }
                .id(navigationID)
                .onOpenURL { url in
                    // A complication opens the check-in screen; it never records a confirmation.
                    if url.scheme == "rillora-watch", url.host == "checkin" { navigationID = UUID() }
                }
        }
    }
}
