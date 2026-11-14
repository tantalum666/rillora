import Foundation
import Observation

struct CheckInWatchCache: Codable {
    var snapshot: CheckInSnapshot?
    var pending: CheckInCommand?
}

@MainActor @Observable
public final class CheckInWatchStore {
    private(set) var cache = CheckInWatchCache()
    var message: String?
    @ObservationIgnored private let persistence: any CheckInPersistence
    @ObservationIgnored private let now: () -> Date
    @ObservationIgnored var send: ((Data) -> Void)?
    @ObservationIgnored var changed: (() -> Void)?
    init(persistence: any CheckInPersistence, now: @escaping () -> Date = Date.init) {
        self.persistence = persistence; self.now = now
        do {
            if let data = try persistence.load() {
                let previous = try CheckInWire.decode(CheckInWatchCache.self, data)
                if let snapshot = previous.snapshot { _ = try snapshot.validated() }
                if let pending = previous.pending { guard pending.binding == previous.snapshot?.binding else { throw CheckInFailure.invalid } }
                cache = previous
            }
        } catch { message = CheckInText.get("storageFailed") }
    }
    func refresh() { if let data = try? CheckInWire.encode(CheckInEnvelope.refresh) { send?(data) } }
    func queue(_ action: CheckInAction) {
        guard cache.pending == nil, let snapshot = cache.snapshot, snapshot.available, let binding = snapshot.binding else { return }
        var next = cache
        next.pending = .init(id: UUID(), binding: binding, expectedRevision: snapshot.revision, action: action, reportedAt: now())
        guard save(next) else { return }
        message = nil; retry()
    }
    func retry() {
        guard let pending = cache.pending else { refresh(); return }
        let age = now().timeIntervalSince(pending.reportedAt)
        guard age.isFinite, age >= -300, age <= 86400 else {
            var next = cache; next.pending = nil
            if save(next) { message = CheckInText.get("expired") }; return
        }
        if let data = try? CheckInWire.encode(CheckInEnvelope(version: 1, command: pending)) { send?(data) }
    }
    func receiveSnapshot(_ data: Data) {
        do { try apply(try CheckInWire.decode(CheckInSnapshot.self, data).validated(), reply: nil) }
        catch { message = CheckInText.get("failed") }
    }
    func receiveReply(_ data: Data) {
        do {
            let reply = try CheckInWire.decode(CheckInReply.self, data)
            _ = try reply.snapshot.validated()
            if let accepted = reply.acceptedID, !reply.snapshot.receiptIDs.contains(accepted) { throw CheckInFailure.invalid }
            try apply(reply.snapshot, reply: reply)
        } catch { message = CheckInText.get("failed") }
    }
    private func apply(_ snapshot: CheckInSnapshot, reply: CheckInReply?) throws {
        CheckInDebug.status("watch.receivedBinding", snapshot.binding == nil ? 0 : 1)
        CheckInDebug.status("watch.receivedAvailable", snapshot.available ? 1 : 0)
        if let old = cache.snapshot, snapshot.binding != nil {
            if old.binding == snapshot.binding, snapshot.revision < old.revision { return }
            if snapshot.updatedAt < old.updatedAt { return }
        }
        let bindingChanged = cache.snapshot?.binding != snapshot.binding
        var next = cache; next.snapshot = snapshot
        var message: String?
        if let pending = next.pending {
            if pending.binding != snapshot.binding {
                next.pending = nil; message = CheckInText.get("changed")
            } else if snapshot.receiptIDs.contains(pending.id) {
                next.pending = nil; message = CheckInText.get("synced")
            } else if let rejection = reply?.rejection, rejection != "phoneUnavailable" {
                next.pending = nil
                let keys = ["changed", "expired", "unlinked", "permissionDenied", "storageFailed", "failed"]
                message = CheckInText.get(keys.contains(rejection) ? rejection : "failed")
            } else if snapshot.revision != pending.expectedRevision {
                next.pending = nil; message = CheckInText.get("changed")
            }
        }
        guard save(next) else { return }
        if let message { self.message = message }
        else if bindingChanged || !snapshot.available { self.message = nil }
    }
    @discardableResult private func save(_ next: CheckInWatchCache) -> Bool {
        do { try persistence.save(CheckInWire.encode(next)); cache = next; changed?(); return true }
        catch { message = CheckInText.get("storageFailed"); return false }
    }
}
