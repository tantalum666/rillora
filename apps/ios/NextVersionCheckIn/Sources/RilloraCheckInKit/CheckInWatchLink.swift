#if os(watchOS)
import Foundation
@preconcurrency import WatchConnectivity

@MainActor
public final class CheckInWatchLink: NSObject, WCSessionDelegate {
    private let session = WCSession.default
    private weak var store: CheckInWatchStore?
    public init(store: CheckInWatchStore) {
        self.store = store; super.init()
        store.send = { [weak self] data in self?.send(data) }
        store.changed = { [weak self] in self?.removeObsoleteTransfers() }
        session.delegate = self; session.activate()
    }
    private func send(_ data: Data) {
        CheckInDebug.status("watch.sendActivation", session.activationState.rawValue)
        CheckInDebug.status("watch.reachable", session.isReachable ? 1 : 0)
        guard session.activationState == .activated else { return }
        guard let envelope = try? CheckInWire.decode(CheckInEnvelope.self, data) else { return }
        if let command = envelope.command {
            let exists = session.outstandingUserInfoTransfers.contains {
                guard let data = $0.userInfo[CheckInWire.key] as? Data,
                      let queued = try? CheckInWire.decode(CheckInEnvelope.self, data) else { return false }
                return queued.command?.id == command.id
            }
            if !exists { session.transferUserInfo([CheckInWire.key: data]) }
        }
        guard session.isReachable else { return }
        guard let store else { return }
        session.sendMessageData(data, replyHandler: CheckInDelivery.reply(to: store),
            errorHandler: CheckInDelivery.retainPendingOnFailure)
    }
    private func removeObsoleteTransfers() {
        for transfer in session.outstandingUserInfoTransfers {
            guard let data = transfer.userInfo[CheckInWire.key] as? Data,
                  let command = try? CheckInWire.decode(CheckInEnvelope.self, data).command else { continue }
            if command.id != store?.cache.pending?.id { transfer.cancel() }
        }
    }
    private func connected() {
        CheckInDebug.status("watch.activation", session.activationState.rawValue)
        CheckInDebug.status("watch.context", session.receivedApplicationContext.count)
        if let data = session.receivedApplicationContext[CheckInWire.key] as? Data { store?.receiveSnapshot(data) }
        store?.retry()
    }
    nonisolated public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        CheckInDebug.status("watch.activationCallback", activationState.rawValue)
        Task { @MainActor [weak self] in self?.connected() }
    }
    nonisolated public func sessionReachabilityDidChange(_ session: WCSession) {
        Task { @MainActor [weak self] in self?.connected() }
    }
    nonisolated public func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        CheckInDebug.status("watch.contextCallback", applicationContext.count)
        guard applicationContext.count == 1, let data = applicationContext[CheckInWire.key] as? Data,
              data.count <= CheckInWire.limit else { return }
        Task { @MainActor [weak self] in
            self?.store?.receiveSnapshot(data)
            if self?.store?.cache.pending != nil { self?.store?.retry() }
        }
    }
}

extension CheckInWatchStore {
    public static func local() -> CheckInWatchStore {
        #if DEBUG && targetEnvironment(simulator)
        if let mode = ProcessInfo.processInfo.environment["RILLORA_WATCH_UI_FIXTURE"] {
            return synthetic(mode: mode)
        }
        #endif
        return CheckInWatchStore(persistence: KeychainCheckInPersistence(item: "watch"))
    }
}

#if DEBUG && targetEnvironment(simulator)
extension CheckInWatchStore {
    private static func synthetic(mode: String) -> CheckInWatchStore {
        let store = CheckInWatchStore(persistence: MemoryCheckInPersistence())
        var phone = CheckInState(account: "11111111-1111-4111-8111-111111111111", now: Date())
        phone.configure(enabled: true, cadence: .day, now: Date())
        func snapshot() -> CheckInSnapshot {
            .init(binding: phone.binding, revision: phone.revision, available: true, enabled: phone.enabled, cadence: phone.cadence,
                nextDue: phone.nextDue, confirmation: phone.confirmation, receiptIDs: phone.receipts.map { $0.command.id },
                updatedAt: Date(), notificationsAllowed: true, reminderScheduled: phone.enabled)
        }
        if let data = try? CheckInWire.encode(snapshot()) { store.receiveSnapshot(data) }
        store.send = { [weak store] data in
            guard mode != "offline", let envelope = try? CheckInWire.decode(CheckInEnvelope.self, data) else { return }
            var accepted: UUID?, errorKey: String?
            if let command = envelope.command {
                do { _ = try phone.apply(command, origin: .watch, now: Date()); accepted = command.id }
                catch { errorKey = CheckInText.errorKey(error) }
            }
            if let reply = try? CheckInWire.encode(CheckInReply(snapshot: snapshot(), acceptedID: accepted, rejection: errorKey)) {
                store?.receiveReply(reply)
            }
        }
        return store
    }
}
#endif
#endif
