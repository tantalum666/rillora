import Foundation

enum CheckInDebug {
    static func status(_ name: String, _ value: Int) {
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["RILLORA_CHECKIN_LINK_QA"] == "1" {
            // Local SDK diagnostics only: never print payloads, identities or timestamps.
            print("Rillora check-in SDK: \(name)=\(value)")
        }
        #endif
    }
}
