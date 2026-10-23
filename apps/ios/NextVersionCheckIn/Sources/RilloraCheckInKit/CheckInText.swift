import Foundation

enum CheckInText {
    static func get(_ key: String) -> String { Bundle.module.localizedString(forKey: key, value: key, table: "Localizable") }
    static func cadence(_ value: CheckInCadence) -> String {
        get(value == .day ? "day" : (value == .threeDays ? "threeDays" : "week"))
    }
    static func errorKey(_ error: Error) -> String {
        switch error as? CheckInFailure {
        case .unlinked: "unlinked"
        case .changed: "changed"
        case .expired: "expired"
        case .permission: "permissionDenied"
        case .storage: "storageFailed"
        case .scheduling: "scheduleFailed"
        default: "failed"
        }
    }
    static func error(_ error: Error) -> String { get(errorKey(error)) }
}
