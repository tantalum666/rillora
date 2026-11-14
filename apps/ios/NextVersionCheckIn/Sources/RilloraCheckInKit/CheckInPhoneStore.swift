import Foundation
import Observation

@MainActor
protocol CheckInNotifying: AnyObject {
    func activate()
    func permission(request: Bool) async throws -> Bool
    func isScheduled(_ state: CheckInState) async -> Bool
    func schedule(_ state: CheckInState) async throws
    func clear(binding: UUID)
}

@MainActor @Observable
public final class CheckInPhoneStore {
    private(set) var state: CheckInState?
    private(set) var active = false
    private(set) var busy = false
    private(set) var notificationsAllowed = false
    private(set) var reminderScheduled = false
    var message: String?
    public var showReminder = false
    @ObservationIgnored private let persistence: any CheckInPersistence
    @ObservationIgnored private let notifier: any CheckInNotifying
    @ObservationIgnored private let now: () -> Date
    @ObservationIgnored private var generation = 0
    @ObservationIgnored var publish: ((CheckInSnapshot) -> Void)?
    @ObservationIgnored var notificationAction: (binding: UUID, revision: Int)?
    @ObservationIgnored private var loaded = true
    init(persistence: any CheckInPersistence, notifier: any CheckInNotifying, now: @escaping () -> Date = Date.init) {
        self.persistence = persistence; self.notifier = notifier; self.now = now
        do { if let data = try persistence.load() { state = try CheckInWire.decode(CheckInState.self, data).validated() } }
        catch { loaded = false; message = CheckInText.get("storageFailed") }
    }
    public func start() { notifier.activate() }
    public func activate(accountID: String) async {
        guard UUID(uuidString: accountID) != nil else { return }
        if !loaded {
            do {
                state = try persistence.load().map { try CheckInWire.decode(CheckInState.self, $0).validated() }
                loaded = true; message = nil
            } catch { message = CheckInText.get("storageFailed"); return }
        }
        if active, state?.account == accountID { return }
        generation += 1
        if state?.account != accountID {
            if let previous = state?.binding { notifier.clear(binding: previous) }
            let replacement = CheckInState(account: accountID, now: now())
            do { try persistence.save(CheckInWire.encode(replacement)); state = replacement }
            catch { active = false; message = CheckInText.get("storageFailed"); publish?(snapshot); return }
        }
        active = true
        await refreshPermission()
        #if os(iOS)
        await handlePendingNotification()
        #endif
    }
    public func temporarilyUnavailable() { active = false; generation += 1; publish?(snapshot) }
    public func deactivate() {
        let previous = state?.binding
        reminderScheduled = false
        generation += 1; active = false; state = nil; notificationAction = nil; showReminder = false
        if let previous { notifier.clear(binding: previous) }
        do { try persistence.save(nil) } catch { message = CheckInText.get("storageFailed") }
        publish?(snapshot)
    }
    var snapshot: CheckInSnapshot {
        guard let state else { return .unlinked(now: now()) }
        return .init(binding: state.binding, revision: state.revision, available: active, enabled: state.enabled,
            cadence: state.cadence, nextDue: state.nextDue, confirmation: state.confirmation,
            receiptIDs: state.receipts.map { $0.command.id }, updatedAt: max(state.changedAt, now()), notificationsAllowed: notificationsAllowed, reminderScheduled: reminderScheduled)
    }
    func refreshPermission() async {
        let epoch = generation
        do { let allowed = try await notifier.permission(request: false); if epoch == generation {
            notificationsAllowed = allowed
            if allowed, message == CheckInText.get("permissionDenied") { message = nil }
        } }
        catch { if epoch == generation { notificationsAllowed = false } }
        if epoch == generation, let current = state {
            let scheduled = await notifier.isScheduled(current)
            if epoch == generation, state?.revision == current.revision { reminderScheduled = scheduled }
        }
        if epoch == generation { publish?(snapshot) }
    }
    func configure(enabled: Bool, cadence: CheckInCadence) async {
        guard active, !busy, var next = state else { return }
        busy = true; message = nil; let epoch = generation
        defer { finishOperation() }
        do {
            if enabled {
                let allowed = try await notifier.permission(request: true)
                guard epoch == generation, active else { return }
                notificationsAllowed = allowed
                guard allowed else { throw CheckInFailure.permission }
            }
            next.configure(enabled: enabled, cadence: cadence, now: now())
            try persistence.save(CheckInWire.encode(next)); state = next
            reminderScheduled = false
            if enabled { try await notifier.schedule(next); if epoch == generation { reminderScheduled = true } } else { notifier.clear(binding: next.binding) }
            guard epoch == generation else {
                notifier.clear(binding: next.binding)
                if state?.binding == next.binding { reminderScheduled = false }
                return
            }
            message = CheckInText.get(enabled ? "reminderEnabled" : "paused")
        } catch { if epoch == generation { message = CheckInText.error(error) } }
    }
    func confirm() async {
        guard let state else { return }
        let command = CheckInCommand(id: UUID(), binding: state.binding, expectedRevision: state.revision, action: .confirm, reportedAt: now())
        let reply = await receive(command, origin: .phone)
        if reply.acceptedID == command.id, message != CheckInText.get("scheduleFailed") { message = CheckInText.get("confirmedHere") }
    }
    func receive(_ command: CheckInCommand, origin: CheckInOrigin) async -> CheckInReply {
        guard active, !busy, var next = state else { return .init(snapshot: snapshot, acceptedID: nil, rejection: "phoneUnavailable") }
        busy = true; let epoch = generation
        defer { finishOperation() }
        do {
            if command.action == .resume {
                let allowed = try await notifier.permission(request: false)
                guard epoch == generation, active else { throw CheckInFailure.unlinked }
                notificationsAllowed = allowed
                guard allowed else { throw CheckInFailure.permission }
            }
            let changed = try next.apply(command, origin: origin, now: now())
            if changed {
                try persistence.save(CheckInWire.encode(next)); state = next
                reminderScheduled = false
                do { if next.enabled { try await notifier.schedule(next); if epoch == generation { reminderScheduled = true } } else { notifier.clear(binding: next.binding) } }
                catch { if epoch == generation { message = CheckInText.get("scheduleFailed") } }
            }
            guard epoch == generation, active else {
                notifier.clear(binding: next.binding)
                if state?.binding == next.binding { reminderScheduled = false }
                return .init(snapshot: snapshot, acceptedID: nil, rejection: "unlinked")
            }
            return .init(snapshot: snapshot, acceptedID: command.id, rejection: nil)
        } catch {
            if epoch == generation { message = CheckInText.error(error) }
            return .init(snapshot: snapshot, acceptedID: nil, rejection: CheckInText.errorKey(error))
        }
    }
    private func finishOperation() {
        // Keep the serialization slot until the old OS scheduling call settles,
        // even across account revalidation. Its cleanup cannot cancel a newer request.
        busy = false; publish?(snapshot)
        #if os(iOS)
        if notificationAction != nil { Task { [weak self] in await self?.handlePendingNotification() } }
        #endif
    }
    func handle(_ data: Data) async -> Data? {
        do {
            let envelope = try CheckInWire.decode(CheckInEnvelope.self, data)
            guard envelope.version == 1 else { throw CheckInFailure.invalid }
            if let command = envelope.command { return try CheckInWire.encode(await receive(command, origin: .watch)) }
            return try CheckInWire.encode(CheckInReply(snapshot: snapshot, acceptedID: nil, rejection: nil))
        } catch { return nil }
    }
}
