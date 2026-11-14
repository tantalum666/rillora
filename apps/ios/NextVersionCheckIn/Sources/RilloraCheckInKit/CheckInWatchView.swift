#if os(watchOS)
import SwiftUI

public struct CheckInWatchView: View {
    @Bindable private var store: CheckInWatchStore
    @Environment(\.scenePhase) private var scenePhase
    public init(store: CheckInWatchStore) { self.store = store }
    public var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 14) {
                if let snapshot = store.cache.snapshot, snapshot.binding != nil {
                    Button { store.queue(.confirm) } label: {
                        Text(CheckInText.get("confirm")).foregroundStyle(.black)
                    }
                        .buttonStyle(.borderedProminent)
                        .disabled(store.cache.pending != nil || !snapshot.available)
                        .accessibilityIdentifier("watch.checkin.confirm")
                    if store.cache.pending != nil {
                        Label(CheckInText.get("pending"), systemImage: "arrow.triangle.2.circlepath")
                            .accessibilityElement(children: .combine)
                            .accessibilityIdentifier("watch.checkin.pending")
                        Button(CheckInText.get("retry")) { store.retry() }.accessibilityIdentifier("watch.checkin.retry")
                    }
                    if store.message == CheckInText.get("synced") {
                        Label(CheckInText.get("synced"), systemImage: "checkmark.circle")
                            .accessibilityElement(children: .combine).accessibilityIdentifier("watch.checkin.synced")
                    } else if let message = store.message {
                        Text(message).font(.caption).accessibilityIdentifier("watch.checkin.message")
                    }
                    if let confirmation = snapshot.confirmation {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(CheckInText.get("lastConfirmation")).font(.caption).foregroundStyle(.secondary)
                            Text(confirmation.reportedAt, format: .dateTime.month().day().hour().minute())
                        }
                    } else { Text(CheckInText.get("notConfirmed")).font(.caption) }
                    Button(CheckInText.get(snapshot.enabled ? "pause" : "resume")) { store.queue(snapshot.enabled ? .pause : .resume) }
                        .disabled(store.cache.pending != nil || !snapshot.available || (!snapshot.enabled && !snapshot.notificationsAllowed))
                        .accessibilityIdentifier(snapshot.enabled ? "watch.checkin.pause" : "watch.checkin.resume")
                    if !snapshot.enabled { Text(CheckInText.get("paused")).font(.caption) }
                    if !snapshot.notificationsAllowed {
                        Text(CheckInText.get("scheduleWarning")).font(.caption)
                    } else if snapshot.enabled && !snapshot.reminderScheduled {
                        Text(CheckInText.get("scheduleFailed")).font(.caption)
                    }
                    if let due = snapshot.nextDue, snapshot.reminderScheduled {
                        Text(CheckInText.get("nextReminder")).font(.caption).foregroundStyle(.secondary)
                        Text(due, format: .dateTime.month().day().hour().minute()).font(.caption)
                    }
                    if !snapshot.available { Text(CheckInText.get("phoneUnavailable")).font(.caption) }
                } else {
                    Text(CheckInText.get("unlinked"))
                    if let message = store.message { Text(message).font(.caption).accessibilityIdentifier("watch.checkin.message") }
                }
                Button(CheckInText.get("refresh")) { store.refresh() }.accessibilityIdentifier("watch.checkin.refresh")
                NavigationLink(CheckInText.get("aboutCheckIn")) {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 12) {
                            Text(CheckInText.get("watchBoundary"))
                            Text(CheckInText.get("watchHealth"))
                        }.padding(.horizontal, 4)
                    }
                }
            }.padding(.horizontal, 4)
        }
        .navigationTitle(CheckInText.get("title"))
        .tint(Color(red: 0.83, green: 0.94, blue: 0.69))
        .task { store.refresh() }
        .onChange(of: scenePhase) { _, phase in if phase == .active { store.retry() } }
        .overlay { if scenePhase != .active { Color.black.ignoresSafeArea() } }
        .privacySensitive().accessibilityIdentifier("watch.checkin.view")
    }
}
#endif
