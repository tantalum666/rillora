import XCTest
import UserNotifications
@testable import RilloraCheckInKit

@MainActor
final class CheckInSystemTests: XCTestCase {
    func testDeferredNotificationKeysExistInBothApplicationLanguages() throws {
        for (language, title) in [("en", "Time to check in"), ("zh-Hans", "可以报个平安了")] {
            let path = try XCTUnwrap(Bundle.main.path(forResource: language, ofType: "lproj"))
            let bundle = try XCTUnwrap(Bundle(path: path))
            XCTAssertEqual(bundle.localizedString(forKey: "rillora.checkin.notification.title", value: nil, table: "Localizable"), title)
            XCTAssertNotEqual(bundle.localizedString(forKey: "rillora.checkin.notification.body", value: nil, table: "Localizable"), "rillora.checkin.notification.body")
        }
    }
    func testNotificationRequestUsesGenericContentAndCanBeRemovedByBinding() async throws {
        let notifier = CheckInNotifications(), now = Date()
        notifier.activate()
        var state = CheckInState(account: UUID().uuidString, now: now)
        state.configure(enabled: true, cadence: .threeDays, now: now)
        defer { notifier.clear(binding: state.binding) }
        try await notifier.schedule(state)
        let requests = await UNUserNotificationCenter.current().pendingNotificationRequests()
        let request = try XCTUnwrap(requests.first { $0.identifier == CheckInNotifications.identifier(state.binding) })
        XCTAssertEqual((request.trigger as? UNTimeIntervalNotificationTrigger)?.timeInterval, 259200)
        XCTAssertTrue(request.trigger?.repeats == true)
        XCTAssertEqual(request.content.userInfo.count, 2)
        XCTAssertFalse(request.content.body.contains(state.account))
        XCTAssertEqual(request.content.categoryIdentifier, CheckInNotifications.category)
        let beforeRemoval = await notifier.isScheduled(state)
        XCTAssertTrue(beforeRemoval)
        notifier.clear(binding: state.binding)
        let afterRemoval = await notifier.isScheduled(state)
        XCTAssertFalse(afterRemoval)
    }
    func testNotificationConfirmationRequiresForegroundAndDeviceAuthentication() async {
        let notifier = CheckInNotifications()
        notifier.activate()
        let categories = await UNUserNotificationCenter.current().notificationCategories()
        let action = categories.first { $0.identifier == CheckInNotifications.category }?.actions.first
        XCTAssertTrue(action?.options.contains(.foreground) == true)
        XCTAssertTrue(action?.options.contains(.authenticationRequired) == true)
        _ = notifier
    }
    func testDeviceOnlyStorageRoundTripAndBoundedDeletion() throws {
        let persistence = KeychainCheckInPersistence(item: "local-test-" + UUID().uuidString)
        defer { try? persistence.save(nil) }
        let state = CheckInState(account: UUID().uuidString, now: Date())
        let bytes = try CheckInWire.encode(state)
        try persistence.save(bytes)
        XCTAssertEqual(try persistence.load(), bytes)
        try persistence.save(nil)
        XCTAssertNil(try persistence.load())
    }
}
