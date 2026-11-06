import Foundation
import Testing
@testable import RilloraCheckInKit

@MainActor private final class WatchTestNotifier: CheckInNotifying {
    func activate() {}
    func permission(request: Bool) async throws -> Bool { true }
    func isScheduled(_ state: CheckInState) async -> Bool { state.enabled }
    func schedule(_ state: CheckInState) async throws {}
    func clear(binding: UUID) {}
}
@MainActor private final class WatchPersistence: CheckInPersistence {
    var data: Data?
    var fail = false
    func load() throws -> Data? { data }
    func save(_ data: Data?) throws { if fail { throw CheckInFailure.storage }; self.data = data }
}
private let date = Date(timeIntervalSince1970: 1_700_000_000)
@MainActor private func phone() async -> CheckInPhoneStore {
    let store = CheckInPhoneStore(persistence: MemoryCheckInPersistence(), notifier: WatchTestNotifier(), now: { date })
    await store.activate(accountID: "11111111-1111-4111-8111-111111111111")
    return store
}

@Test @MainActor func pendingIsPersistedAndOnlyARecordedPhoneReceiptCompletesIt() async throws {
    let phone = await phone(), persistence = WatchPersistence()
    let watch = CheckInWatchStore(persistence: persistence, now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot))
    var outbound: Data?
    watch.send = { outbound = $0 }
    watch.queue(.confirm)
    let original = try #require(watch.cache.pending)
    #expect(watch.cache.snapshot?.confirmation == nil)
    let restarted = CheckInWatchStore(persistence: persistence, now: { date })
    #expect(restarted.cache.pending == original)
    restarted.send = { outbound = $0 }; restarted.retry()
    let bytes = try #require(outbound)
    let envelope = try CheckInWire.decode(CheckInEnvelope.self, bytes)
    #expect(envelope.command == original)
    let received = await phone.handle(bytes)
    let response = try #require(received)
    restarted.receiveReply(response)
    #expect(restarted.cache.pending == nil)
    #expect(restarted.cache.snapshot?.confirmation?.origin == .watch)
    #expect(restarted.message == CheckInText.get("synced"))
    let revision = phone.state?.revision
    _ = await phone.handle(try #require(outbound)); #expect(phone.state?.revision == revision)
    restarted.queue(.pause)
    #expect(restarted.cache.pending != nil); #expect(restarted.message == nil)
    #expect(restarted.cache.snapshot?.confirmation != nil)
}
@Test @MainActor func unavailablePhoneAndRepeatedTapsDoNotCreateFalseSuccess() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    let original = try #require(watch.cache.pending); watch.queue(.pause)
    #expect(watch.cache.pending == original)
    phone.temporarilyUnavailable()
    let request = try CheckInWire.encode(CheckInEnvelope(version: 1, command: original))
    let response = try #require(await phone.handle(request))
    watch.receiveReply(response)
    #expect(watch.cache.pending == original); #expect(watch.message != CheckInText.get("synced"))
    #expect(phone.state?.confirmation == nil)
}
@Test @MainActor func inventedAcknowledgementWithoutTheMatchingReceiptCannotClearTheOutbox() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    let id = try #require(watch.cache.pending?.id)
    watch.receiveReply(try CheckInWire.encode(CheckInReply(snapshot: phone.snapshot, acceptedID: id, rejection: nil)))
    #expect(watch.cache.pending?.id == id); #expect(watch.message == CheckInText.get("failed"))
}
@Test @MainActor func accountRemovalOrReplacementClearsPendingAndOldDisplayedState() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    phone.deactivate(); watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot))
    #expect(watch.cache.pending == nil); #expect(watch.cache.snapshot?.binding == nil)
    await phone.activate(accountID: "22222222-2222-4222-8222-222222222222")
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot))
    #expect(watch.cache.snapshot?.binding == phone.state?.binding); #expect(watch.cache.snapshot?.confirmation == nil)
}
@Test @MainActor func settingsChangedOnPhoneRejectTheQueuedOldRevision() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    let sent = try #require(watch.cache.pending)
    await phone.configure(enabled: true, cadence: .week)
    let request = try CheckInWire.encode(CheckInEnvelope(version: 1, command: sent))
    let response = try #require(await phone.handle(request))
    watch.receiveReply(response)
    #expect(watch.cache.pending == nil); #expect(watch.cache.snapshot?.cadence == .week)
    #expect(phone.state?.confirmation == nil); #expect(watch.message == CheckInText.get("changed"))
}
@Test @MainActor func expiredOfflineCommandsAreDiscardedWithoutSending() async throws {
    let phone = await phone(); var clock = date
    let watch = CheckInWatchStore(persistence: WatchPersistence(), now: { clock })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    var calls = 0; watch.send = { _ in calls += 1 }; clock = date.addingTimeInterval(86401); watch.retry()
    #expect(watch.cache.pending == nil); #expect(calls == 0); #expect(watch.message == CheckInText.get("expired"))
}
@Test @MainActor func unsavedOutboxCannotTransmit() async throws {
    let phone = await phone(), persistence = WatchPersistence()
    let watch = CheckInWatchStore(persistence: persistence, now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); persistence.fail = true
    var calls = 0; watch.send = { _ in calls += 1 }; watch.queue(.confirm)
    #expect(calls == 0); #expect(watch.cache.pending == nil)
}
@Test @MainActor func olderSnapshotsCannotOverwriteAnAcceptedState() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    let older = phone.snapshot; await phone.configure(enabled: true, cadence: .week)
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); let current = watch.cache.snapshot
    watch.receiveSnapshot(try CheckInWire.encode(older)); #expect(watch.cache.snapshot == current)
    let invalid = try CheckInWire.encode(CheckInEnvelope(version: 99, command: nil))
    #expect(await phone.handle(invalid) == nil)
}
@Test @MainActor func wireSnapshotHasAnExactNonHealthNonIdentityFieldAllowlist() async throws {
    let phone = await phone()
    let object = try #require(JSONSerialization.jsonObject(with: CheckInWire.encode(phone.snapshot)) as? [String: Any])
    #expect(Set(object.keys) == ["version", "binding", "revision", "available", "enabled", "cadence", "receiptIDs", "updatedAt", "notificationsAllowed", "reminderScheduled"])
}

@Test @MainActor func sdkCallbacksCanEnterFromABackgroundExecutorWithoutCrashingOrInventingDelivery() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    let pending = try #require(watch.cache.pending)
    await Task.detached { CheckInDelivery.retainPendingOnFailure(CheckInFailure.invalid) }.value
    #expect(watch.cache.pending == pending)
    let bytes = try CheckInWire.encode(CheckInEnvelope(version: 1, command: pending))
    let response = try #require(await phone.handle(bytes))
    let callback = CheckInDelivery.reply(to: watch)
    await Task.detached { callback(response) }.value
    for _ in 0..<100 { if watch.cache.pending == nil { break }; try await Task.sleep(for: .milliseconds(5)) }
    #expect(watch.cache.pending == nil); #expect(watch.cache.snapshot?.confirmation?.origin == .watch)
}

@Test @MainActor func disconnectClearsAFormerSuccessMessageAsWellAsTheOldRecord() async throws {
    let phone = await phone(), watch = CheckInWatchStore(persistence: WatchPersistence(), now: { date })
    watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot)); watch.queue(.confirm)
    let pending = try #require(watch.cache.pending)
    let request = try CheckInWire.encode(CheckInEnvelope(version: 1, command: pending))
    let response = try #require(await phone.handle(request)); watch.receiveReply(response)
    #expect(watch.message == CheckInText.get("synced"))
    phone.deactivate(); watch.receiveSnapshot(try CheckInWire.encode(phone.snapshot))
    #expect(watch.cache.snapshot?.binding == nil); #expect(watch.cache.snapshot?.confirmation == nil)
    #expect(watch.message == nil)
}
