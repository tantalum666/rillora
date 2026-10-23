import Foundation

/// SDK reply blocks run on a background queue. Construct them outside the
/// MainActor so Swift 6 cannot inherit an actor precondition at block entry.
enum CheckInDelivery {
    nonisolated static func reply(to store: CheckInWatchStore) -> @Sendable (Data) -> Void {
        { [weak store] data in
            Task { @MainActor [weak store] in store?.receiveReply(data) }
        }
    }
    nonisolated static let retainPendingOnFailure: @Sendable (any Error) -> Void = { _ in }
}
