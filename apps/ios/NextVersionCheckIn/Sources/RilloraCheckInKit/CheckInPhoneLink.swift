#if os(iOS)
import Foundation
@preconcurrency import WatchConnectivity

// WatchConnectivity's imported reply closure is called once on the main actor.
private final class PhoneReply: @unchecked Sendable {
    let call: (Data) -> Void
    init(_ call: @escaping (Data) -> Void) { self.call = call }
}

@MainActor
public final class CheckInPhoneLink: NSObject, WCSessionDelegate {
    private let session: WCSession?
    private weak var store: CheckInPhoneStore?
    public init(store: CheckInPhoneStore) {
        self.store = store; session = WCSession.isSupported() ? .default : nil
        super.init()
        store.publish = { [weak self] value in self?.publish(value) }
        session?.delegate = self; session?.activate()
    }
    private func publish(_ value: CheckInSnapshot) {
        CheckInDebug.status("phone.available", value.available ? 1 : 0)
        CheckInDebug.status("phone.binding", value.binding == nil ? 0 : 1)
        CheckInDebug.status("phone.activation", session?.activationState.rawValue ?? -1)
        CheckInDebug.status("phone.installed", session?.isWatchAppInstalled == true ? 1 : 0)
        guard let session, session.activationState == .activated, session.isPaired, session.isWatchAppInstalled,
              let data = try? CheckInWire.encode(value) else { return }
        // Latest state replaces an older queued context; health records are never in it.
        do {
            try session.updateApplicationContext([CheckInWire.key: data])
            CheckInDebug.status("phone.published", 1)
        } catch { CheckInDebug.status("phone.publishError", (error as NSError).code) }
    }
    nonisolated public func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        Task { @MainActor [weak self] in if let self, let store = self.store { self.publish(store.snapshot) } }
    }
    nonisolated public func sessionDidBecomeInactive(_ session: WCSession) {}
    nonisolated public func sessionDidDeactivate(_ session: WCSession) { session.activate() }
    nonisolated public func sessionWatchStateDidChange(_ session: WCSession) {
        Task { @MainActor [weak self] in if let self, let store = self.store { self.publish(store.snapshot) } }
    }
    nonisolated public func session(_ session: WCSession, didReceiveMessageData messageData: Data, replyHandler: @escaping (Data) -> Void) {
        let reply = PhoneReply(replyHandler)
        Task { @MainActor [weak self] in
            let result = await self?.store?.handle(messageData)
            reply.call(result ?? Data())
        }
    }
    nonisolated public func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any]) {
        guard userInfo.count == 1, let data = userInfo[CheckInWire.key] as? Data, data.count <= CheckInWire.limit else { return }
        Task { @MainActor [weak self] in
            guard let self, let store = self.store else { return }
            _ = await store.handle(data); self.publish(store.snapshot)
        }
    }
}
#endif
