#if os(iOS)
import Foundation
import UserNotifications

@MainActor
final class CheckInNotifications: NSObject, CheckInNotifying, UNUserNotificationCenterDelegate {
    private let center: UNUserNotificationCenter
    static let category = "RILLORA_CHECKIN_NEXT"
    static let confirm = "RILLORA_CHECKIN_CONFIRM"
    var opened: ((UUID, Int, Bool) -> Void)?
    init(center: UNUserNotificationCenter = .current()) {
        self.center = center; super.init()
    }
    func activate() {
        center.delegate = self
        let action = UNNotificationAction(identifier: Self.confirm, title: CheckInText.get("confirm"), options: [.foreground, .authenticationRequired])
        center.setNotificationCategories([UNNotificationCategory(identifier: Self.category, actions: [action], intentIdentifiers: [])])
    }
    func permission(request: Bool) async throws -> Bool {
        var settings = await center.notificationSettings()
        if request, settings.authorizationStatus == .notDetermined {
            _ = try await center.requestAuthorization(options: [.alert, .sound])
            settings = await center.notificationSettings()
        }
        return [.authorized, .provisional, .ephemeral].contains(settings.authorizationStatus)
    }
    static func identifier(_ binding: UUID) -> String { "rillora.checkin." + binding.uuidString.lowercased() }
    func isScheduled(_ state: CheckInState) async -> Bool {
        let pending = await center.pendingNotificationRequests()
        return state.enabled && pending.contains { $0.identifier == Self.identifier(state.binding) && ($0.content.userInfo["revision"] as? Int) == state.revision }
    }
    func schedule(_ state: CheckInState) async throws {
        guard state.enabled else { clear(binding: state.binding); return }
        let content = UNMutableNotificationContent()
        content.title = NSString.localizedUserNotificationString(forKey: "rillora.checkin.notification.title", arguments: nil)
        content.body = NSString.localizedUserNotificationString(forKey: "rillora.checkin.notification.body", arguments: nil)
        content.sound = .default; content.categoryIdentifier = Self.category
        content.userInfo = ["binding": state.binding.uuidString, "revision": state.revision]
        let request = UNNotificationRequest(identifier: Self.identifier(state.binding), content: content,
            trigger: UNTimeIntervalNotificationTrigger(timeInterval: Double(state.cadence.rawValue), repeats: true))
        center.removePendingNotificationRequests(withIdentifiers: [request.identifier])
        do { try await center.add(request) } catch { throw CheckInFailure.scheduling }
        center.removeDeliveredNotifications(withIdentifiers: [request.identifier])
    }
    func clear(binding: UUID) {
        let ids = [Self.identifier(binding)]
        center.removePendingNotificationRequests(withIdentifiers: ids)
        center.removeDeliveredNotifications(withIdentifiers: ids)
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse,
                                            withCompletionHandler completionHandler: @escaping () -> Void) {
        let info = response.notification.request.content.userInfo
        let binding = (info["binding"] as? String).flatMap(UUID.init(uuidString:))
        let revision = info["revision"] as? Int
        let category = response.notification.request.content.categoryIdentifier
        let confirms = response.actionIdentifier == "RILLORA_CHECKIN_CONFIRM"
        if category == "RILLORA_CHECKIN_NEXT", let binding, let revision {
            Task { @MainActor [weak self] in self?.opened?(binding, revision, confirms) }
        }
        completionHandler()
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification,
                                            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}

extension CheckInPhoneStore {
    public static func local() -> CheckInPhoneStore {
        #if DEBUG && targetEnvironment(simulator)
        if ProcessInfo.processInfo.environment["RILLORA_HEALTH_UI_FIXTURE"] == "1",
           ProcessInfo.processInfo.environment["RILLORA_CHECKIN_NOTIFICATION_QA"] != "1" {
            return CheckInPhoneStore(persistence: MemoryCheckInPersistence(), notifier: SyntheticCheckInNotifications())
        }
        #endif
        let notifications = CheckInNotifications()
        let persistence: any CheckInPersistence
        #if DEBUG && targetEnvironment(simulator)
        persistence = ProcessInfo.processInfo.environment["RILLORA_HEALTH_UI_FIXTURE"] == "1"
            ? MemoryCheckInPersistence() : KeychainCheckInPersistence(item: "phone")
        #else
        persistence = KeychainCheckInPersistence(item: "phone")
        #endif
        let store = CheckInPhoneStore(persistence: persistence, notifier: notifications)
        notifications.opened = { [weak store] binding, revision, confirms in
            guard let store else { return }
            store.showReminder = true
            if confirms {
                store.notificationAction = (binding, revision)
                if store.active { Task { await store.handlePendingNotification() } }
            }
        }
        return store
    }
    func handlePendingNotification() async {
        guard active, !busy, let action = notificationAction else { return }
        notificationAction = nil
        guard state?.binding == action.binding, state?.revision == action.revision else { message = CheckInText.get("changed"); return }
        await confirm()
    }
}

#if DEBUG && targetEnvironment(simulator)
@MainActor private final class SyntheticCheckInNotifications: CheckInNotifying {
    func activate() {}
    func permission(request: Bool) async throws -> Bool { ProcessInfo.processInfo.environment["RILLORA_CHECKIN_DENIED_QA"] != "1" }
    func isScheduled(_ state: CheckInState) async -> Bool { state.enabled }
    func schedule(_ state: CheckInState) async throws {}
    func clear(binding: UUID) {}
}
#endif
#endif
