#if RILLORA_CHECKIN_NEXT_VERSION
import UIKit
import RilloraCheckInKit

/// Own one notification/Watch delegate for the process, outside View reconstruction.
@MainActor
final class RilloraNextAppDelegate: NSObject, UIApplicationDelegate {
    let checkInStore = CheckInPhoneStore.local()
    private var link: CheckInPhoneLink?
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {
        checkInStore.start()
        link = CheckInPhoneLink(store: checkInStore)
        return true
    }
}
#endif
