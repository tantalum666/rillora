import Foundation
import Testing
@testable import RilloraCheckInKit

private let now = Date(timeIntervalSince1970: 1_700_000_000)
private let account = "11111111-1111-4111-8111-111111111111"
private func command(_ state: CheckInState, action: CheckInAction = .confirm, date: Date = now, id: UUID = UUID()) -> CheckInCommand {
    .init(id: id, binding: state.binding, expectedRevision: state.revision, action: action, reportedAt: date)
}
@Test func explicitConfirmationResetsTheReminderWithoutChangingOtherAuthority() throws {
    var state = CheckInState(account: account, now: now)
    #expect(!state.enabled); #expect(state.nextDue == nil)
    state.configure(enabled: true, cadence: .day, now: now)
    #expect(try state.apply(command(state), origin: .phone, now: now))
    #expect(state.nextDue == now.addingTimeInterval(86400)); #expect(state.confirmation?.receivedAt == now)
    #expect(try state.validated() == state)
}
@Test func exactRetryIsIdempotentAndIdReuseCannotChangeTheAction() throws {
    var state = CheckInState(account: account, now: now); let sent = command(state)
    #expect(try state.apply(sent, origin: .watch, now: now)); let revision = state.revision
    #expect(try !state.apply(sent, origin: .watch, now: now.addingTimeInterval(10)))
    #expect(state.revision == revision); #expect(state.receipts.count == 1)
    #expect(throws: CheckInFailure.invalid) { try state.apply(command(state, action: .pause, id: sent.id), origin: .watch, now: now) }
}
@Test func oldAccountOldRevisionExpiredAndFutureCommandsAreRejected() throws {
    var state = CheckInState(account: account, now: now)
    let foreign = CheckInState(account: account, now: now)
    #expect(throws: CheckInFailure.unlinked) { try state.apply(command(foreign), origin: .watch, now: now) }
    let stale = command(state); state.configure(enabled: false, cadence: .day, now: now)
    #expect(throws: CheckInFailure.changed) { try state.apply(stale, origin: .watch, now: now) }
    #expect(throws: CheckInFailure.expired) { try state.apply(command(state, date: now.addingTimeInterval(-86401)), origin: .watch, now: now) }
    #expect(throws: CheckInFailure.expired) { try state.apply(command(state, date: now.addingTimeInterval(301)), origin: .watch, now: now) }
    #expect(state.confirmation == nil)
}
@Test func pauseResumeAndBoundedReceiptsKeepTheStateConsistent() throws {
    var state = CheckInState(account: account, now: now)
    _ = try state.apply(command(state, action: .resume), origin: .watch, now: now)
    #expect(state.enabled)
    _ = try state.apply(command(state, action: .pause), origin: .watch, now: now)
    #expect(!state.enabled && state.nextDue == nil)
    for _ in 0..<40 { _ = try state.apply(command(state), origin: .phone, now: now) }
    #expect(state.receipts.count == 32); #expect(try state.validated() == state)
}
@Test func malformedAndOversizedWirePayloadsAreRejected() throws {
    #expect(throws: (any Error).self) { try CheckInWire.decode(CheckInSnapshot.self, Data("{}".utf8)) }
    #expect(throws: CheckInFailure.invalid) { try CheckInWire.decode(CheckInEnvelope.self, Data(repeating: 0, count: CheckInWire.limit + 1)) }
    var snapshot = CheckInSnapshot.unlinked(now: now); snapshot.version = 99
    #expect(throws: CheckInFailure.invalid) { try snapshot.validated() }
}

@MainActor private final class Notifier: CheckInNotifying {
    func activate() {}
    var allowed = true
    var requested = 0
    var scheduled: [CheckInState] = []
    var cleared: [UUID] = []
    var fail = false
    var suspended = false
    var continuation: CheckedContinuation<Bool, Error>?
    var suspendSchedule = false
    var scheduleContinuation: CheckedContinuation<Void, Never>?
    func permission(request: Bool) async throws -> Bool {
        if request { requested += 1 }
        if suspended { return try await withCheckedThrowingContinuation { continuation = $0 } }
        return allowed
    }
    func isScheduled(_ state: CheckInState) async -> Bool { scheduled.last?.revision == state.revision && state.enabled }
    func schedule(_ state: CheckInState) async throws {
        if suspendSchedule { await withCheckedContinuation { scheduleContinuation = $0 } }
        if fail { throw CheckInFailure.scheduling }; scheduled.append(state)
    }
    func clear(binding: UUID) { cleared.append(binding) }
}
@MainActor private final class Persistence: CheckInPersistence {
    var data: Data?
    var fail = false
    func load() throws -> Data? { data }
    func save(_ data: Data?) throws { if fail { throw CheckInFailure.storage }; self.data = data }
}
@Test @MainActor func permissionDenialDoesNotEnableOrScheduleReminders() async throws {
    let persistence = Persistence(), notifier = Notifier()
    let store = CheckInPhoneStore(persistence: persistence, notifier: notifier, now: { now })
    await store.activate(accountID: account); notifier.allowed = false
    await store.configure(enabled: true, cadence: .day)
    #expect(store.state?.enabled == false); #expect(notifier.scheduled.isEmpty)
    #expect(store.message == CheckInText.get("permissionDenied"))
    await store.confirm(); #expect(store.state?.confirmation != nil)
    await store.configure(enabled: true, cadence: .day)
    notifier.allowed = true; await store.refreshPermission()
    #expect(store.message == nil); #expect(store.state?.enabled == false)
}
@Test @MainActor func saveFailureDoesNotAcknowledgeOrScheduleAConfirmation() async throws {
    let persistence = Persistence(), notifier = Notifier()
    let store = CheckInPhoneStore(persistence: persistence, notifier: notifier, now: { now })
    await store.activate(accountID: account); let current = try #require(store.state); persistence.fail = true
    let result = await store.receive(command(current), origin: .watch)
    #expect(result.acceptedID == nil); #expect(store.state?.confirmation == nil); #expect(notifier.scheduled.isEmpty)
}
@Test @MainActor func confirmedRecordSurvivesNotificationSchedulingFailureAndRetry() async throws {
    let notifier = Notifier(), persistence = Persistence()
    let store = CheckInPhoneStore(persistence: persistence, notifier: notifier, now: { now })
    await store.activate(accountID: account); await store.configure(enabled: true, cadence: .day)
    let sent = command(try #require(store.state)); notifier.fail = true
    let reply = await store.receive(sent, origin: .watch)
    #expect(reply.acceptedID == sent.id); #expect(store.state?.confirmation != nil)
    #expect(!reply.snapshot.reminderScheduled)
    let revision = store.state?.revision
    #expect(await store.receive(sent, origin: .watch).acceptedID == sent.id); #expect(store.state?.revision == revision)
}
@Test @MainActor func accountReplacementRejectsOldWatchCommandsAndClearsOldNotifications() async throws {
    let notifier = Notifier()
    let actual = CheckInPhoneStore(persistence: Persistence(), notifier: notifier, now: { now })
    await actual.activate(accountID: account); let previous = try #require(actual.state)
    await actual.configure(enabled: true, cadence: .day)
    await actual.activate(accountID: "22222222-2222-4222-8222-222222222222")
    #expect(actual.state?.binding != previous.binding); #expect(notifier.cleared.contains(previous.binding))
    #expect(await actual.receive(command(previous), origin: .watch).acceptedID == nil)
    actual.deactivate(); #expect(actual.state == nil); #expect(!actual.active)
}
@Test @MainActor func latePermissionCompletionCannotReviveASignedOutAccount() async throws {
    let notifier = Notifier()
    let actual = CheckInPhoneStore(persistence: Persistence(), notifier: notifier, now: { now })
    await actual.activate(accountID: account); notifier.suspended = true
    let task = Task { await actual.configure(enabled: true, cadence: .day) }
    while notifier.continuation == nil { await Task.yield() }
    actual.deactivate(); notifier.continuation?.resume(returning: true); notifier.continuation = nil; await task.value
    #expect(!actual.active); #expect(actual.state == nil); #expect(notifier.scheduled.isEmpty)
}
@Test @MainActor func snapshotOmitsAccountAndRawHealthInformation() async throws {
    let store = CheckInPhoneStore(persistence: Persistence(), notifier: Notifier(), now: { now })
    await store.activate(accountID: account)
    let data = try CheckInWire.encode(store.snapshot), text = String(decoding: data, as: UTF8.self)
    #expect(!text.contains(account)); #expect(!text.contains("heartRate")); #expect(!text.contains("samples"))
    #expect(try CheckInWire.decode(CheckInSnapshot.self, data).validated() == store.snapshot)
}

@Test @MainActor func inFlightSchedulingKeepsItsSlotAcrossReauthentication() async throws {
    let notifier = Notifier()
    let actual = CheckInPhoneStore(persistence: Persistence(), notifier: notifier, now: { now })
    await actual.activate(accountID: account); notifier.suspendSchedule = true
    let old = Task { await actual.configure(enabled: true, cadence: .day) }
    while notifier.scheduleContinuation == nil { await Task.yield() }
    actual.temporarilyUnavailable(); await actual.activate(accountID: account)
    #expect(actual.busy)
    notifier.suspendSchedule = false
    await actual.configure(enabled: true, cadence: .week)
    #expect(notifier.scheduled.isEmpty)
    notifier.scheduleContinuation?.resume(); notifier.scheduleContinuation = nil; await old.value
    #expect(!actual.busy); #expect(!actual.reminderScheduled)
    let cleared = notifier.cleared.count
    await actual.configure(enabled: true, cadence: .week)
    #expect(actual.state?.cadence == .week); #expect(actual.reminderScheduled)
    #expect(notifier.cleared.count == cleared)
}
